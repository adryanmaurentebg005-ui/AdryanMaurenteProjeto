import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import authRoutes from "../routes/auth.js";

dotenv.config();

const app = express();

// ---------- CONFIGURAÇÃO DO SERVIDOR ----------
app.set("view engine", "ejs");
app.set("views", path.resolve("views"));

// Para processar form (POST)
app.use(express.urlencoded({ extended: true }));

// ---------- CONEXÃO COM MONGO ----------
async function connectMongo() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB conectado (Vercel Serverless)");
  }
}
connectMongo();

// ---------- CONFIGURAÇÃO DE SESSÃO (COMPATÍVEL COM VERCEL) ----------
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
      secure: "auto",
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 60 * 60 * 24 * 7, // 7 dias
      autoRemove: "native",
    }),
  })
);

// ---------- ROTAS ----------
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.render("index", {
    title: "Home",
    user: req.session.user || null,
  });
});

// ---------- ERRO ----------
app.use((err, req, res, next) => {
  console.error("Erro geral:", err);
  res.status(500).send("Erro interno!");
});

// ---------- EXPORT PARA VERCEL ----------
export default app;
export { connectMongo };