const pino = require('pino');

const env = process.env.NODE_ENV || 'development';

const logger = pino({
    level: process.env.LOG_LEVEL ||
        (['development', 'dev'].includes(env) ? 'debug' : 'info'),

    timestamp: pino.stdTimeFunctions.isoTime
});

module.exports = logger;