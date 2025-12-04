import express from 'express';
import mongoose from 'mongoose';
import { Hospede } from '../models/index.js';

const router = express.Router();

// ===================== LOGIN GET =====================
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/login', {
    title: 'Login',
    page: 'login',
    user: req.session.user || null,
    error: null
  });
});

// ===================== LOGIN POST =====================
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (mongoose.connection.readyState !== 1) {
      return res.render('auth/login', {
        title: 'Login',
        page: 'login',
        user: req.session.user || null,
        error: "Erro de conexão com o banco de dados!"
      });
    }

    const user = await Hospede.findOne({ email, senha }).lean();

    if (!user) {
      return res.render('auth/login', {
        title: 'Login',
        page: 'login',
        user: req.session.user || null,
        error: 'Email ou senha incorretos'
      });
    }

    // salva usuário na sessão
    req.session.user = {
      id: String(user._id),
      nome: user.nome,
      email: user.email,
      tipo: user.tipo
    };

    req.session.save(err => {
      if (err) {
        console.error('Erro ao salvar sessão:', err);
        return res.render('auth/login', {
          title: 'Login',
          page: 'login',
          user: req.session.user || null,
          error: 'Erro ao salvar sessão'
        });
      }
      res.redirect('/');
    });

  } catch (err) {
    console.error('Erro no POST /login:', err);
    res.render('auth/login', {
      title: 'Login',
      page: 'login',
      user: req.session.user || null,
      error: 'Erro ao fazer login'
    });
  }
});

// ===================== CADASTRO GET =====================
router.get('/cadastro', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/cadastro', {
    title: 'Cadastro',
    page: 'cadastro',
    user: req.session.user || null,
    error: null,
    success: null
  });
});

// ===================== CADASTRO POST =====================
router.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, confirmarSenha } = req.body;

    if (senha !== confirmarSenha) {
      return res.render('auth/cadastro', {
        title: 'Cadastro',
        page: 'cadastro',
        user: req.session.user || null,
        error: 'As senhas não coincidem',
        success: null
      });
    }

    if (senha.length < 6) {
      return res.render('auth/cadastro', {
        title: 'Cadastro',
        page: 'cadastro',
        user: req.session.user || null,
        error: 'A senha deve ter pelo menos 6 caracteres',
        success: null
      });
    }

    const exists = await Hospede.findOne({ email }).lean();
    if (exists) {
      return res.render('auth/cadastro', {
        title: 'Cadastro',
        page: 'cadastro',
        user: req.session.user || null,
        error: 'Este email já está cadastrado',
        success: null
      });
    }

    // gera CPF placeholder
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let randomString = "";
    for (let i = 0; i < 11; i++) {
      randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    await Hospede.create({
      nome,
      email,
      senha,
      tipo: 'cliente',
      dataCadastro: new Date(),
      CPF: `PLACEHOLDER-${randomString}`
    });

    res.render('auth/cadastro', {
      title: 'Cadastro',
      page: 'cadastro',
      user: req.session.user || null,
      error: null,
      success: 'Cadastro realizado com sucesso! Faça login para continuar.'
    });

  } catch (err) {
    console.error('Erro no POST /cadastro:', err);
    res.render('auth/cadastro', {
      title: 'Cadastro',
      page: 'cadastro',
      user: req.session.user || null,
      error: 'Erro no cadastro',
      success: null
    });
  }
});

// ===================== LOGOUT =====================
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

export default router;
