// src/utils/identificacaoUsuario.js
const { sendWhatsAppMessage } = require('../services/twilioService');
const { identificarUsuario } = require('../services/citsmartService');

async function subfluxoIdentificacao({ from, body, session }) {
	const log = (...msg) => console.log(`[IDUSUÁRIO][${from}]:`, ...msg);

	// Se já está autenticado, nada a fazer
	if (session.idempregado) return true;

	// Passo 1: tentar por telefone
	if (!session.identStep) {
		const telefone = from.replace('whatsapp:+', '');
		log('Tentando pelo telefone:', telefone);

		try {
			const usuario = await identificarUsuario({ telefone });
			if (usuario?.idempregado) {
				session.idempregado = usuario.idempregado;
				await sendWhatsAppMessage(
					from,
					'✅ Identificado por telefone!',
				);
				return true;
			}
		} catch (err) {
			log('Erro ao identificar por telefone:', err.message);
			// continua para pedir nome
		}

		session.identStep = 'nome';
		await sendWhatsAppMessage(
			from,
			'Não achei seu telefone. Digite seu NOME COMPLETO (com acentos):',
		);
		return false;
	}

	// Passo 2: tentar por nome
	if (session.identStep === 'nome') {
		const nome = body.trim();
		log('Tentando por nome:', nome);

		if (!nome) {
			await sendWhatsAppMessage(
				from,
				'Nome vazio! Digite seu nome completo:',
			);
			return false;
		}

		try {
			const usuario = await identificarUsuario({ nome });
			if (usuario?.idempregado) {
				session.idempregado = usuario.idempregado;
				await sendWhatsAppMessage(from, '✅ Identificado por nome!');
				return true;
			}
		} catch (err) {
			log('Erro ao identificar por nome:', err.message);
		}

		session.identStep = 'login';
		await sendWhatsAppMessage(
			from,
			'Não localizei pelo nome. Agora, digite o LOGIN do CITSMART:',
		);
		return false;
	}

	// Passo 3: tentar por login
	if (session.identStep === 'login') {
		const login = body.trim();
		log('Tentando por login:', login);

		if (!login) {
			await sendWhatsAppMessage(
				from,
				'Login vazio! Digite seu login do CITSMART:',
			);
			return false;
		}

		try {
			const usuario = await identificarUsuario({ login });
			if (usuario?.idempregado) {
				session.idempregado = usuario.idempregado;
				await sendWhatsAppMessage(from, '✅ Identificado por login!');
				return true;
			}
		} catch (err) {
			log('Erro ao identificar por login:', err.message);
		}

		// Se chegar aqui, falhou todas as tentativas
		await sendWhatsAppMessage(
			from,
			'❌ Não consegui identificar. Sessão encerrada. Contate o suporte.',
		);
		return 'ENCERRAR';
	}

	return false;
}

module.exports = { subfluxoIdentificacao };
