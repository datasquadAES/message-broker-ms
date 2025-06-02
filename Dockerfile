# Dockerfile
FROM node:18

# Establece el directorio de trabajo correcto
WORKDIR /app

# Copia el archivo package.json para instalar dependencias
COPY package.json .

# Instala las dependencias
RUN npm install

# Copia el resto de los archivos del proyecto
COPY . .

# Expone el puerto en el que corre la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "main.js"]
