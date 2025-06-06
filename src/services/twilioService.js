const twilio = require('twilio');
const axios = require('axios');
const config = require('../config/env');

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

const sendWhatsAppMessage = async (to, message) => {
	return client.messages.create({
		from: config.twilio.from,
		to,
		body: message,
	});
};

const sendWhatsAppList = async (to) => {
    return client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to,
        interactive: {
            type: 'list',
            header: {
                type: 'text',
                text: 'Menu principal'
            },
            body: {
                text: 'Como posso te ajudar? Escolha uma opção:'
            },
            footer: {
                text: 'Desenvolvido por Sr. Dourado'
            },
            action: {
                button: 'Selecionar',
                sections: [
                    {
                        title: 'Serviços',
                        rows: [
                            { id: 'consultar_tickets', title: 'Consultar tickets', description: 'Ver últimos tickets' },
                            { id: 'abrir_ticket', title: 'Abrir ticket', description: 'Registrar novo chamado' },
                            { id: 'artigos_ajuda', title: 'Artigos de ajuda', description: 'Ver artigos úteis' }
                        ]
                    }
                ]
            }
        }
    });
};
module.exports = { sendWhatsAppMessage, sendWhatsAppList };

