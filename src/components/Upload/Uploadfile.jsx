import { Uploader } from "../../utils/upload";
import {useState, useRef} from "react";
import "./Upload.css";

function UploadFile () {
    const [files, setFiles] = useState([]);
    const [uploadStatus, setUploadStatus] = useState({});
    const [uploaderInstances, setUploaderInstances] = useState({});
    const fileInputRef = useRef(null); // Ref para el input de archivos
  
    const onUpload = (fileIndex) => {
      const file = files[fileIndex];
      if (file) {
        const { name } = file;
        const videoUploaderOptions = {
          fileName: name.split('.')[0],
          file: file,
        };
  
        const uploader = new Uploader(videoUploaderOptions);
        setUploaderInstances(prev => ({ ...prev, [fileIndex]: uploader }));
  
        uploader
          .onProgress(({ percentage: newPercentage }) => {
            setUploadStatus(prev => ({ ...prev, [fileIndex]: { ...prev[fileIndex], percentage: newPercentage }}));
          })
          .onError((error) => {
            console.error(error);
            setUploadStatus(prev => ({ ...prev, [fileIndex]: { ...prev[fileIndex], error: true }}));
          });
  
        uploader.start();
        setUploadStatus(prev => ({ ...prev, [fileIndex]: { uploading: true, percentage: 0 }}));
  
        // Opcional: Limpiar el input file después de subir un archivo
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
  
    const onAddAnotherFile = (e) => {
      const newFile = e.target.files[0];
      if (newFile) {
        setFiles(prev => [...prev, newFile]);
        setUploadStatus(prev => ({ ...prev, [files.length]: { uploading: false, percentage: 0 }}));
      }
    };
  
    const onCancel = (fileIndex) => {
      uploaderInstances[fileIndex]?.abort();
      setUploadStatus(prev => ({ ...prev, [fileIndex]: { ...prev[fileIndex], uploading: false, percentage: 0 }}));
    };
  
    return (
      <div className="App">
        <h1>Upload your files</h1>
        <input
          type="file"
          ref={fileInputRef} // Asigna la ref al input
          onChange={onAddAnotherFile}
        />
        {files.map((file, index) => (
          <div key={index} className="file-container">
            {uploadStatus[index]?.uploading ? (
              <>
                <div className="uploading-status">Uploading <span className="file-name">{file.name}</span>: {uploadStatus[index].percentage}%</div>
                <button onClick={() => onCancel(index)}>Cancel</button>
              </>
            ) : (
              <>
                <div className="file-name">{file.name}</div>
                <button onClick={() => onUpload(index)}>Upload</button>
              </>
            )}
          </div>
        ))}
      </div>
    );
  }
export default UploadFile;