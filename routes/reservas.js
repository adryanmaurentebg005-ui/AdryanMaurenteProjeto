import express from 'express';
import { Hospede, Quarto, Reserva, Pagamento } from '../models/index.js';

const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
}

router.get('/nova/:quartoId', requireAuth, async (req, res, next) => {
  try {
    const quarto = await Quarto.findById(req.params.quartoId).lean();
    if (!quarto || quarto.status !== 'Disponível') return res.redirect('/quartos');

    res.render('reservas/nova', {
      title: 'Fazer Reserva',
      page: 'reservas',
      quarto,
      error: null
    });
  } catch (err) {
    next(err);
  }
}); 

router.post('/nova/:quartoId', requireAuth, async (req, res, next) => {
  try {
    const { dataCheckIn, dataCheckOut, numeroHospedes, metodoPagamento, nome, CPF, telefone, endereco } = req.body;
    const quartoId = req.params.quartoId;

    const quarto = await Quarto.findById(quartoId);
    if (!quarto || quarto.status !== 'Disponível') return res.redirect('/quartos');

    if (new Date(dataCheckIn) >= new Date(dataCheckOut)) {
      return res.render('reservas/nova', {
        title: 'Fazer Reserva',
        page: 'reservas',
        quarto: quarto.toObject(),
        error: 'A data de check-out deve ser posterior à data de check-in'
      });
    }

    if (parseInt(numeroHospedes) > quarto.capacidade) {
      return res.render('reservas/nova', {
        title: 'Fazer Reserva',
        page: 'reservas',
        quarto: quarto.toObject(),
        error: `Este quarto comporta no máximo ${quarto.capacidade} pessoas`
      });
    }

    let hospede = await Hospede.findOne({ email: req.session.user.email });
    if (!hospede) {
      hospede = await Hospede.create({
        nome: nome || req.session.user.nome,
        CPF: CPF || '',
        telefone: telefone || '',
        email: req.session.user.email,
        endereco: endereco || '',
        dataNascimento: '',
        dataCadastro: new Date()
      });
    }

    const dias = Math.ceil((new Date(dataCheckOut) - new Date(dataCheckIn)) / (1000 * 60 * 60 * 24));
    const valorTotal = dias * quarto.precoDiaria;

    const reserva = await Reserva.create({
      hospede: hospede._id,
      quarto: quarto._id,
      numeroHospedes: parseInt(numeroHospedes),
      checkIn: new Date(dataCheckIn),
      checkOut: new Date(dataCheckOut),
      status: 'Confirmada',
      total: valorTotal
    });

    const pagamento = await Pagamento.create({
      reserva: reserva._id,
      metodo: metodoPagamento,
      valor: valorTotal,
      status: 'Aprovado'
    });

    quarto.status = 'Ocupado';
    await quarto.save();

    res.render('reservas/sucesso', {
      title: 'Reserva Confirmada',
      page: 'reservas',
      reserva: reserva.toObject(),
      quarto: quarto.toObject(),
      hospede: hospede.toObject(),
      pagamento: pagamento.toObject()
    });
  } catch (err) {
    next(err);
  }
});

export default router;
