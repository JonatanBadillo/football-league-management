import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';

const app = express();
const PORT = 3000;

// Middleware y configuración de vistas
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.get('/', (req, res) => {
  res.send('Welcome to Football League Management');
});

// Opciones SSL
const sslOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

// Iniciar servidor HTTPS
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});
