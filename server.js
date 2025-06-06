const app = require('./app');
const config = require('./src/config/env');

app.listen(config.port, () => {
    console.log(`Servidor rodando na porta ${config.port}`);
});
 