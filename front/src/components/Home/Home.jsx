import React from 'react';
import "../Home/Home.css"

function Home() {
  return (
    <div className="home-container">
      <h2>Bienvenido al Proyecto de Carga de Archivos</h2>
      <p>
        Este proyecto es una prueba técnica para Mercado Libre (MELI) enfocada en la carga de archivos a AWS. 
        Permite a los usuarios cargar archivos de forma segura y eficiente a un bucket de Amazon S3, 
        utilizando tecnologías de punta para la gestión de la autenticación y la autorización.
      </p>
      <p>
        Características principales:
        <ul>
          <li>Carga segura de archivos a Amazon S3.</li>
          <li>Autenticación de usuarios mediante Amazon Cognito.</li>
          <li>Interfaz de usuario amigable para la carga y gestión de archivos.</li>
          <li>Protección de rutas para asegurar el acceso a funcionalidades específicas.</li>
        </ul>
      </p>
      <p>
        Este proyecto demuestra el uso de servicios en la nube para mejorar la escalabilidad y seguridad 
        de las aplicaciones web modernas, integrando servicios de AWS con una aplicación React.
      </p>
    </div>
  );
}

export default Home;