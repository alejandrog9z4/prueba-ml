# Proyecto de Carga de Archivos Masivos

Este proyecto proporciona una API desarrollada para permitir la carga de archivos de gran tamaño, superiores a 1GB, enfocándose en aspectos clave como seguridad, rendimiento, usabilidad y eficiencia en el almacenamiento.

## Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **AWS Services**:
  - AWS WAF para la seguridad a nivel de aplicación.
  - Autoscaling Group para manejar la variabilidad en la carga.
  - S3 para el almacenamiento eficiente de archivos.
  - Application Load Balancer (ALB) y Target Group para distribuir el tráfico.
  - AWS Amplify para la implementación y gestión del frontend.
  - AWS Cognito para la autenticación y gestión de usuarios.

## Características

- **Carga Eficiente de Grandes Archivos**: Capacidad para cargar archivos de más de 1GB, utilizando técnicas como la carga multipart,la optimización de la red y logica para reintentos de archivos cuya presigned url haya finalizado debido al tiempo de vida de 15 minutos por url.
- **Seguridad**: Implementación de AWS WAF para proteger contra ataques comunes, junto con la autenticación de usuarios mediante AWS Cognito.
- **Alta Disponibilidad y Escalabilidad**: Uso de Autoscaling Groups y ALB para garantizar la disponibilidad del servicio y su capacidad para escalar según la demanda.
- **Almacenamiento Eficiente**: Utilización de AWS S3 para el almacenamiento de archivos, aprovechando su escalabilidad, durabilidad y bajo costo.

## Requisitos

- Node.js 14.5 o superior
- Cuenta de AWS con los servicios mencionados configurados.

## Configuración y Despliegue

### Configurar AWS Services:

- Asegúrate de tener configurados AWS S3, AWS Cognito, AWS WAF, y los demás servicios según las necesidades de tu proyecto.

### Configuración del Proyecto Backend:

- Clona este repositorio.
- Instala las dependencias con `npm install`.
- Configura las variables de entorno necesarias (AWS credentials, configuraciones de servicio, etc.).

### Ejecución Local:

- Ejecuta `npm start` para iniciar la aplicación en modo de desarrollo.

### Despliegue:

- Utiliza AWS Amplify o tu método de despliegue preferido para poner en producción la aplicación.

## Uso

La API soporta la carga de archivos mediante una solicitud HTTP POST. Los usuarios deben estar autenticados para poder cargar archivos. Consulta la documentación de la API para más detalles sobre los endpoints y cómo utilizarlos.

## Seguridad

Este proyecto implementa varias medidas de seguridad, incluyendo:

- Autenticación y autorización de usuarios mediante AWS Cognito.
- Protección contra ataques web comunes con AWS WAF.
- Se agrego una Georestriccion para solo permitir peticiones de Mexico, Colombia y Argentina 
- Comunicaciones seguras a través de HTTPS.

## Contribuir

Las contribuciones son bienvenidas. Por favor, revisa las guías de contribución antes de hacer un pull request.

## Nota

Este proyecto está ligado a llaves de aws de una cuenta personal se deben hacer las adecuaciones para su implementacion en su cuenta personal adjunto en el pdf
