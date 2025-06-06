const axios = require('axios');
const https = require('https');
const config = require('../config/env');

const agent = new https.Agent({ rejectUnauthorized: false });

let botToken = '';

const autenticarBotCitsmart = async () => {
	try {
		const payload = {
			clientId: config.citsmart.clientId,
			language: config.citsmart.language,
			userName: config.citsmart.botLocalName + '\\' + config.citsmart.botUsername, 
			password: config.citsmart.botPassword
		}; 

		const response = await axios.post(
			`${config.citsmart.baseUrl}/services/login`,
			payload,
			{
				httpsAgent: agent,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				}
			}
		);

		botToken = response.data.sessionID;
		console.log('✅ Bot CITSMART autenticado com sucesso.');
	} catch (err) {
		console.error('❌ Erro ao autenticar no CITSMART:', err.response?.data || err.message);
		throw err;
	}
};


const consultarUltimosTickets = async (idempregado) => {
	try {
		const response = await axios.post(
			config.citsmart.request,
			{
				SQLName: 'consulta_ultimos_tickets',
				dynamicModel: { idempregado }
			},
			{
				httpsAgent: agent,
				headers: {
					'Authorization': botToken
				}
			}
		);
		return response.data.payload;
	} catch (err) {
		console.error('❌ Erro ao consultar últimos tickets:', err.response?.data || err.message);
		return null;
	}
};

const consultarTicketPorNumero = async (idempregado, ticket) => {
	try {
		const response = await axios.post(
			config.citsmart.request,
			{
				SQLName: 'consulta_ticket',
				dynamicModel: {
					idempregado,
					ticket
				}
			},
			{
				httpsAgent: agent,
				headers: {
					'Authorization': botToken
				}
			}
		);
		return response.data.payload[0];
	} catch (err) {
		console.error('❌ Erro ao consultar ticket:', err.response?.data || err.message);
		return null;
	}
};

async function identificarUsuario({ telefone, nome, login }) {
	try {
		const dynamicModel = {};
		if (telefone) dynamicModel.telefone = telefone;
		if (nome) dynamicModel.nome = nome;
		if (login) dynamicModel.login = login;

		const response = await axios.post(
			`${config.citsmart.request}`,
			{
				SQLName: 'identificacaoUsuario',
				dynamicModel
			},
			{
				httpsAgent: agent,
				headers: {
					Authorization: botToken, // tem que garantir o token válido
					'Content-Type': 'application/json'
				}
			}
		);

		const usuario = response.data?.payload?.[0];
		console.log(response)

		return usuario && usuario.idempregado ? usuario : null;
	} catch (error) {
		console.error('Erro ao identificar usuário:', error?.response?.data || error.message);
		return null;
	}
}

module.exports = { 
	autenticarBotCitsmart, 
	consultarUltimosTickets,
	consultarTicketPorNumero,
	identificarUsuario
};
