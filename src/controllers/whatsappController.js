const fs = require('fs');
const path = require('path');
const { sendWhatsAppMessage } = require('../services/twilioService');
const { subfluxoIdentificacao } = require('../utils/identificacaoUsuario');

const userSessions = new Map();

// Função utilitária de log
function logToFile(data) {
	const logDir = path.join(__dirname, '..', 'logs');
	if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
	const filePath = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);
	const logMsg = `[${new Date().toISOString()}] ${data}\n`;
	fs.appendFileSync(filePath, logMsg);
}

const handleIncomingMessage = async (req, res) => {
	const from = req.body.From;
	const body = req.body.Body?.trim();
	const now = Date.now();

	logToFile(`📥 Mensagem recebida de ${from}: ${body}`);

	let session = userSessions.get(from);
	if (!session) {
		session = {
			step: 'aguardando_menu',
			idempregado: null,
			identStep: null,
			lastActivity: now,
		};
		userSessions.set(from, session);

		await sendWhatsAppMessage(from,
			'Olá! Sou seu assistente virtual, como posso te ajudar hoje?\n' +
			'Escolha uma opção:\n' +
			'1️⃣ - Consultar tickets recentes\n' +
			'2️⃣ - Abrir ticket\n' +
			'3️⃣ - Artigos de ajuda\n' +
			'4️⃣ - Encerrar sessão'
		);
		logToFile(`🔵 Menu apresentado para ${from}`);
		return res.sendStatus(200);
	}

	session.lastActivity = now;

	// FLUXO DO MENU
	if (session.step === 'aguardando_menu') {
		if (['1', '2', '3'].includes(body)) {
			session.menuOption = body;
			session.step = 'identificacao_usuario';
		} else if (body === '4') {
			await sendWhatsAppMessage(from, 'Sessão encerrada. Até logo!');
			userSessions.delete(from);
			logToFile(`⚪️ Sessão encerrada para ${from}`);
			return res.sendStatus(200);
		} else {
			await sendWhatsAppMessage(from,
				'Opção inválida! Escolha:\n' +
				'1️⃣ - Consultar tickets recentes\n' +
				'2️⃣ - Abrir ticket\n' +
				'3️⃣ - Artigos de ajuda\n' +
				'4️⃣ - Encerrar sessão'
			);
			logToFile(`🔴 Opção inválida enviada por ${from}: ${body}`);
			return res.sendStatus(200);
		}
	}

	// SUBFLUXO DE IDENTIFICAÇÃO
	if (session.step === 'identificacao_usuario') {
		const identificou = await subfluxoIdentificacao({ from, body, session, logToFile });
		logToFile(`🔸 Resultado identificação (${from}): ${identificou}`);
		if (identificou === true) {
			session.step = 'menu_fluxo';
		} else if (identificou === 'ENCERRAR') {
			userSessions.delete(from);
			logToFile(`⚪️ Sessão encerrada por não identificação (${from})`);
			return res.sendStatus(200);
		} else {
			// aguarda próxima mensagem do user
			return res.sendStatus(200);
		}
	}

	// APÓS IDENTIFICAÇÃO, SEGUE O FLUXO DA OPÇÃO ESCOLHIDA NO MENU
	if (session.step === 'menu_fluxo') {
		switch (session.menuOption) {
			case '1':
				// fluxo de tickets...
				await sendWhatsAppMessage(from, 'Aqui viria a lista de tickets...');
				logToFile(`🟢 Listou tickets para ${from}`);
				break;
			case '2':
				await sendWhatsAppMessage(from, 'Fluxo de abertura de ticket...');
				break;
			case '3':
				await sendWhatsAppMessage(from, 'Artigos de ajuda...');
				break;
			default:
				await sendWhatsAppMessage(from, 'Opção inválida! Encerrando sessão.');
				userSessions.delete(from);
				break;
		}
		// Volta ao menu ou encerra conforme o seu fluxo desejado
		session.step = 'aguardando_menu';
		await sendWhatsAppMessage(from,
			'Deseja realizar outra ação?\n' +
			'1️⃣ - Consultar tickets\n' +
			'2️⃣ - Abrir ticket\n' +
			'3️⃣ - Artigos de ajuda\n' +
			'4️⃣ - Encerrar sessão'
		);
		logToFile(`🔵 Menu reapresentado para ${from}`);
	}

	res.sendStatus(200);
};


module.exports = { handleIncomingMessage };
