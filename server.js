import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3111;
 
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));
 
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); 
app.use(methodOverride('_method'));

app.use(session({
  secret: 'pousada-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

 
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.isAdmin = req.session.user && req.session.user.tipo === 'admin';
  next();
});

import indexRoutes from './routes/index.js';
import authRoutes from './routes/auth.js';
import quartosRoutes from './routes/quartos.js';
import reservasRoutes from './routes/reservas.js';
import adminRoutes from './routes/admin.js';
import perfilRoutes from './routes/perfil.js';

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/quartos', quartosRoutes);
app.use('/reservas', reservasRoutes);
app.use('/admin', adminRoutes);
app.use('/perfil', perfilRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
