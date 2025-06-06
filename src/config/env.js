require('dotenv').config();

const config = {
    port: process.env.PORT || 3000,
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        from: process.env.TWILIO_WHATSAPP_FROM,
    },
    citsmart: {
        baseUrl: process.env.CITSMART_BASE_URL,
        baseUrlHost: process.env.CITSMART_BASE_URL_HOST,
        clientId: process.env.CITSMART_CLIENT_ID,
        language: process.env.CITSMART_LANGUAGE,
        botUsername: process.env.CITSMART_BOT_USERNAME,
        botPassword: process.env.CITSMART_BOT_PASSWORD,
		botLocalName: process.env.CITSMART_BOT_LOCAL_NAME,
		request: process.env.CITSMART_REQUEST
    }
};

module.exports = config;
