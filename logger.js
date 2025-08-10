const fs = require('fs');
const path = require('path');
const { createLogger, transports, format } = require('winston');

// Ensure log directory exists
const logDir = path.join(__dirname, 'log');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logger = createLogger({
    level: 'debug',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}`)
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: path.join(logDir, 'output.log') })
    ]
});

module.exports = logger;