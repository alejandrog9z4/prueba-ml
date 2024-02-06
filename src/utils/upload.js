import axios from "axios"

/**
 * Crea una instancia de axios para las solicitudes HTTP con una base URL predefinida.
 */
const api = axios.create({
  baseURL: "http://meli-lb-1346773068.us-east-1.elb.amazonaws.com",
})

export class Uploader {
  constructor(options) {
    this.chunkSize = options.chunkSize || 1024 * 1024 * 5
    this.threadsQuantity = Math.min(options.threadsQuantity || 5, 15)
    this.file = options.file
    this.fileName = options.fileName
    this.aborted = false
    this.uploadedSize = 0
    this.progressCache = {}
    this.activeConnections = {}
    this.parts = []
    this.uploadedParts = []
    this.fileId = null
    this.fileKey = null
    this.onProgressFn = () => {}
    this.onErrorFn = () => {}
  }

  start() {
    this.initialize()
      .then(() => this.sendNext())
      .catch(error => this.complete(error));
  }
/**
 * Prepara y obtiene las URLs presignadas de AWS para la carga de archivos por partes.
 */
  async initialize() {
    try {

      let fileName = this.fileName
      const ext = this.file.name.split(".").pop()
      if (ext) {
        fileName += `.${ext}`
      }

      const multipartUploadInput = {
        name: fileName,
      }
      const initializeReponse = await api.request({
        url: "/multipartUpload",
        method: "POST",
        data: multipartUploadInput,
      })

      const AWSFileDataOutput = initializeReponse.data

      this.fileId = AWSFileDataOutput.fileId
      this.fileKey = AWSFileDataOutput.fileKey

      const numberOfparts = Math.ceil(this.file.size / this.chunkSize)

      const AWSMultipartFileDataInput = {
        fileId: this.fileId,
        fileKey: this.fileKey,
        parts: numberOfparts,
      }

      const urlsResponse = await api.request({
        url: "/multipartPreSignedUrls",
        method: "POST",
        data: AWSMultipartFileDataInput,
      })

      const newParts = urlsResponse.data.parts
      this.parts.push(...newParts)

      this.sendNext()
    } catch (error) {
      await this.complete(error)
    }
  }
/**
 * Genera una nueva URL presignada para una parte del archivo en caso de necesitarlo.
 */
  async regeneratePresignedUrlForPart(fileKey, fileId, partNumber) {
    try {
      const response = await api.post('/regeneratePresignedUrl', {
        fileKey,
        fileId,
        partNumbers: [partNumber], 
      });
      return response.data.parts[0]; 
    } catch (error) {
      console.log('Error regenerating presigned URL:', error);
      throw error;
    }
  }
/**
 * Maneja el envío de la siguiente parte del archivo, controlando la cantidad de cargas paralelas activas.
 */
  async sendNext() {
    const activeConnections = Object.keys(this.activeConnections).length;

    if (this.parts.length === 0 && activeConnections === 0) {
      this.complete();
      return;
    }

    while (this.parts.length > 0 && Object.keys(this.activeConnections).length < this.threadsQuantity) {
      const part = this.parts.shift();
      if (this.file && part) {
        const sentSize = (part.PartNumber - 1) * this.chunkSize;
        const chunk = this.file.slice(sentSize, sentSize + this.chunkSize);
        const sendChunkPromise = this.sendChunk(chunk, part, 0); 

    
        this.activeConnections[part.PartNumber] = sendChunkPromise;

        sendChunkPromise
          .then(() => {
          
            delete this.activeConnections[part.PartNumber];
            this.sendNext();
          })
          .catch(() => {
            delete this.activeConnections[part.PartNumber];
            this.sendNext();
          });
      }
    }
  }
/**
 * Finaliza el proceso de carga, ya sea exitosamente o con un error, y ejecuta la función de callback correspondiente.
 */
  async complete(error) {
    if (error && !this.aborted) {
      this.onErrorFn(error)
      return
    }

    if (error) {
      this.onErrorFn(error)
      return
    }

    try {
      await this.sendCompleteRequest()
    } catch (error) {
      this.onErrorFn(error)
    }
  }

  async sendCompleteRequest() {
    if (this.fileId && this.fileKey) {
      const fileMultiPartInput = {
        fileId: this.fileId,
        fileKey: this.fileKey,
        parts: this.uploadedParts,
      }

      await api.request({
        url: "/finishMultipartUpload",
        method: "POST",
        data: fileMultiPartInput,
      })
    }
  }
  /**
   * Envía una solicitud para marcar la carga como completa en el servidor.
   */
  async sendChunk(chunk, part, retryCount) {
    return new Promise(async (resolve, reject) => {
      const maxRetries = 3;

      const attemptUpload = async (fileChunk, uploadPart, attemptCount) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadPart.signedUrl);
  
        xhr.upload.addEventListener("progress", (event) => {
          this.handleProgress(uploadPart.PartNumber, event);
        });
  
        xhr.onload = async () => {
          if (xhr.status === 200) {

            const ETag = xhr.getResponseHeader("ETag").replaceAll('"', "");
            this.uploadedParts.push({ PartNumber: uploadPart.PartNumber, ETag: ETag });
            resolve();
          } else {

            retryOrFail(fileChunk, uploadPart, attemptCount);
          }
        };
  
        xhr.onerror = () => {
 
          retryOrFail(fileChunk, uploadPart, attemptCount);
        };
  
 
        xhr.send(fileChunk);
      };
/**
 * Envía una parte del archivo al servidor, con lógica para reintentos en caso de fallo.
 */
      const retryOrFail = async (fileChunk, uploadPart, attemptCount) => {
        if (attemptCount < maxRetries) {
          console.log(`Retrying upload of part ${uploadPart.PartNumber}, attempt ${attemptCount + 1}`);
          try {

            const newPart = await this.regeneratePresignedUrlForPart(this.fileKey, this.fileId, uploadPart.PartNumber);

            attemptUpload(fileChunk, newPart, attemptCount + 1);
          } catch (error) {

            reject(error);
          }
        } else {

          reject(new Error(`Failed to upload part ${uploadPart.PartNumber} after ${maxRetries} attempts`));
        }
      };
  

      attemptUpload(chunk, part, retryCount);
    });
  }  
/**
 * Maneja los eventos de progreso para actualizar el estado de la carga y notificar al usuario.
 */
  handleProgress(part, event) {
    if (this.file) {
      if (event.type === "progress" || event.type === "error" || event.type === "abort") {
        this.progressCache[part] = event.loaded
      }

      if (event.type === "uploaded") {
        this.uploadedSize += this.progressCache[part] || 0
        delete this.progressCache[part]
      }

      const inProgress = Object.keys(this.progressCache)
        .map(Number)
        .reduce((memo, id) => (memo += this.progressCache[id]), 0)

      const sent = Math.min(this.uploadedSize + inProgress, this.file.size)

      const total = this.file.size

      const percentage = Math.round((sent / total) * 100)

      this.onProgressFn({
        sent: sent,
        total: total,
        percentage: percentage,
      })
    }
  }

  upload(file, part, sendChunkStarted, retryCount = 0) {
    const maxRetries = 3; // Define un máximo de reintentos
    return new Promise(async (resolve, reject) => {
      if (!this.fileId || !this.fileKey) {
        return reject(new Error("Missing fileId or fileKey"));
      }
  
      const attemptUpload = async (file, part, retryCount) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", part.signedUrl);
  
        xhr.upload.addEventListener("progress", this.handleProgress.bind(this, part.PartNumber - 1));
        xhr.onreadystatechange = async () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              const ETag = xhr.getResponseHeader("ETag").replaceAll('"', "");
              this.uploadedParts.push({ PartNumber: part.PartNumber, ETag });
              resolve(xhr.status);
            } else if (retryCount < maxRetries) {
              console.log(`Retrying upload of part ${part.PartNumber}, attempt ${retryCount + 1}`);
              try {
                const newPart = await this.regeneratePresignedUrlForPart(this.fileKey, this.fileId, part.PartNumber);
                attemptUpload(file, newPart, retryCount + 1);
              } catch (error) {
                reject(error);
              }
            } else {
              reject(new Error(`Failed to upload part ${part.PartNumber} after ${maxRetries} attempts`));
            }
          }
        };
  
        xhr.onerror = () => reject(new Error(`XHR error for part ${part.PartNumber}`));
        xhr.onabort = () => reject(new Error("Upload aborted by user"));
        xhr.send(file);
      };
  
      sendChunkStarted();
      attemptUpload(file, part, retryCount);
    });
  }

  /**
   * Establece una función de callback para notificar sobre el progreso de la carga.
   */
  onProgress(onProgress) {
    this.onProgressFn = onProgress
    return this
  }
/**
 * Establece una función de callback para manejar errores durante el proceso de carga.
 */
  onError(onError) {
    this.onErrorFn = onError
    return this
  }
/**
 *  Permite abortar todas las cargas activas y marca el proceso de carga como abortado.
 */
  abort() {
    Object.keys(this.activeConnections)
      .map(Number)
      .forEach((id) => {
        this.activeConnections[id].abort()
      })

    this.aborted = true
  }
}
