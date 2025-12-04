import { createServer } from 'http';

import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from '../config/conexao.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3111;

// Wait for MongoDB connection before setting up session store
let sessionStore;
const setupSession = (mongoConnection) => {
  return new MongoStore({
    client: mongoConnection.connection.getClient(),
    touchAfter: 24 * 3600
  });
};
 
app.set('view engine', 'ejs'); 
app.set("views", path.join(process.cwd(), "views"));
 
app.use(express.static(path.join(process.cwd(), "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); 
app.use(methodOverride('_method'));

app.use(session({
  secret: 'pousada-secret-key-2024',
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({
    mongoUrl: 'mongodb+srv://aluno:123@cluster0.ddqnr3p.mongodb.net/pousada?retryWrites=true&w=majority&appName=Cluster0',
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax'
  }
}));

app.use((req, res, next) => {
  console.log('📍 Session ID:', req.sessionID);
  console.log('👤 Session User:', req.session.user);
  res.locals.user = req.session.user || null;
  res.locals.isAdmin = req.session.user && req.session.user.tipo === 'admin';
  next();
});

import indexRoutes from '../routes/index.js';
import authRoutes from '../routes/auth.js';
import quartosRoutes from '../routes/quartos.js';
import reservasRoutes from '../routes/reservas.js';
import adminRoutes from '../routes/admin.js';
import perfilRoutes from '../routes/perfil.js';

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/quartos', quartosRoutes);
app.use('/reservas', reservasRoutes);
app.use('/admin', adminRoutes);
app.use('/perfil', perfilRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
