# Proyecto-3_Delilah-Resto
Proyecto 3 de mi aprendizaje con Acámica, en este el objetivo es aplicar lo aprendido de Back-End. Concretamente se realizará el Back-End para la página de E-Commerce de un restaurante, usando bases de datos relacionales, creando y documentando una API y creando un servidor, todo esto apoyado en herramientas como Postman, MySQL y nodeJS.


# Instrucciones de uso
1. Clonar el repositorio en la carpeta que lo desee.
2. Inicializar MySQL con alguna aplicación como XAMPP.
3. Configurar el puerto en el que trabaja MySQL, el puerto por defecto para la aplicación es el 33067 pero puede cambiar esta configuración en el index.js de la aplicación.
4. Abrir PHPMyAdmin e importar el script SQL llamado "delilah_resto.sql", con el cual se creará la base de datos y las tablas de la aplicación.
5. Ir a la carpeta raiz del proyecto y ejecutar el comando "npm install", para instalar todas la dependencias del package.json.
6. En la misma raiz del proyecto inicializar el servidor con el comando "npx nodemon".
7. Abrir postman e importar la colección "API_Delilah_Restó.postman_collection.json".
8. Y listo! ya podrá probar todos los endpoints con la ayuda de postman y ver los cambios en la base de datos por medio de PHPMyAdmin.

# Importante:
Cuando se importa el script SQL, automaticamente queda registrado un administrador en la base de datos con el cual puede acceder a todas las funcionalidades del aplicativo fácilmente. Para ello puede usar las siguientes credenciales: 

  email: admin@gmail.com
  
  contraseña: admin12345

# Documentación adicional:
Puede documentarse sobre los endpoints del aplicativo también en: https://app.swaggerhub.com/apis-docs/Emmanuel-Garnica/delilah-resto_api/1.0.0
