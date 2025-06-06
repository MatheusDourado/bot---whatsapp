const express = require('express');
const app = express();
const { handleIncomingMessage } = require('./src/controllers/whatsappController');
const { autenticarBotCitsmart } = require('./src/services/citsmartService');

// Adiciona suporte a JSON e texto
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.text());

// Webhook que Twilio vai bater
app.post('/webhook', handleIncomingMessage);

// Autentica com o bot do CITSMART
autenticarBotCitsmart();

module.exports = app;
