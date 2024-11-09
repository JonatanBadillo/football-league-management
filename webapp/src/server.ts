// src/server.ts
import express from 'express';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { engine } from 'express-handlebars';
import adminRoutes from './routes/adminRoutes';
import multer from 'multer';
import sequelize from './config/database';

const app = express();
const PORT = 3000;

// Configuración de Handlebars
app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '../src/views'));

// Middleware para manejar JSON y archivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, '../src/public')));

// Cargar las rutas de administración sin autorización
app.use('/admin', adminRoutes);

// Configuración de Multer para la carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Ruta de carga de imágenes
app.post('/upload-player-image', upload.single('image'), (req, res) => {
  if (req.file) {
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  } else {
    res.status(400).json({ error: 'No se pudo subir la imagen' });
  }
});

// Ruta de la página principal
app.get('/', (req, res) => {
  res.render('home', { title: 'Football League Management' });
});

// Opciones SSL para HTTPS
const sslOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};

// Sincronizar la base de datos y luego iniciar el servidor HTTPS
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Base de datos sincronizada');
    https.createServer(sslOptions, app).listen(PORT, () => {
      console.log(`Server is running on https://localhost:${PORT}`);
    });
  })
  .catch((error: any) => {
    console.error('Error al conectar a la base de datos:', error);
  });
