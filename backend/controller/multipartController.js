const AWS = require("aws-sdk");

/**
 * se crea una sola instancia de conexion a el bucket S3
 */
const BUCKET_NAME = process.env.BUCKET_NAME;
const s3 = new AWS.S3({
  endpoint: new AWS.Endpoint(`https://${BUCKET_NAME}.s3-accelerate.amazonaws.com`),
  useAccelerateEndpoint: true,
});

const MultipartController = {
   
    
/**
 * es temeodo nos permite obtener el key y
 * upload id para posteriormente generar las presigned url
 */
  multipartUpload: async (req, res) => {
    const start = new Date().getTime();
    const { name } = req.body;
    try {
      const multipartUpload = await s3.createMultipartUpload({
        Bucket: BUCKET_NAME,
        Key: `${name}`,
      }).promise();

      res.send({
        fileId: multipartUpload.UploadId,
        fileKey: multipartUpload.Key,
      });
    } catch (error) {
      // Manejar el error adecuadamente
      res.status(500).send(error.message);
    }
  },

/**
 * Metodo para generar las presugned url hacia s3
 * los parametros de entrada son
 * filekey obtenido en el metodo multipartUpload
 * fileId obtenido en el metodo multipartUpload
 * parts es el numero de partes en las ue se dividira el archivo
 */
  multipartPreSignedUrls: async (req, res) => {
    const { fileKey, fileId, parts } = req.body;
    try {
      const promises = Array.from({ length: parts }, (_, index) =>
        s3.getSignedUrlPromise("uploadPart", {
          Bucket: BUCKET_NAME,
          Key: fileKey,
          UploadId: fileId,
          PartNumber: index + 1,
        }),
      );

      const signedUrls = await Promise.all(promises);

      const partSignedUrlList = signedUrls.map((signedUrl, index) => ({
        signedUrl,
        PartNumber: index + 1,
      }));

      res.send({ parts: partSignedUrlList });
    } catch (error) {
      res.status(500).send(error.message);
    }
  },

/**
 * este metodo permite finalizar la subida de las partes del archivo 
 * para posteriormente generar el archivo en una sola parte
 */

  finishMultipartUpload: async (req, res) => {
    const { fileId, fileKey, parts } = req.body;
    console.log(req.body, parts.sort((a, b) => a.PartNumber - b.PartNumber));
    try {
      await s3.completeMultipartUpload({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        UploadId: fileId,
        MultipartUpload: {
          Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
        },
      }).promise();
      res.send();
    } catch (error) {
      res.status(500).send(error.message);
    }
  },


  /**
    * Metodo para reintentar la subida de archivo 
    * debido a que las presigned url tienen un tiempo de vida de 15 min
    * hy un numero maximo de reintentos por parte que es 3
 */
  regeneratePresignedUrlsForFailedParts: async (req, res) => {
    const { fileKey, fileId, partNumbers } = req.body;
    try {
      const promises = partNumbers.map(partNumber =>
        s3.getSignedUrlPromise("uploadPart", {
          Bucket: BUCKET_NAME,
          Key: fileKey,
          UploadId: fileId,
          PartNumber: partNumber,
        }),
      );

      const signedUrls = await Promise.all(promises);

      const partSignedUrlList = signedUrls.map((signedUrl, index) => ({
        signedUrl,
        PartNumber: partNumbers[index],
      }));

      res.send({ parts: partSignedUrlList });
    } catch (error) {
      res.status(500).send(error.message);
    }
  },
};

module.exports = { MultipartController };
