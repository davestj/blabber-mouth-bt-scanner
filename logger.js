const fs = require('fs');
const path = require('path');
const { createLogger, transports, format } = require('winston');
const { get } = require('./config');

const cfg = get();
const logDir = path.join(
  __dirname,
  (cfg.paths && cfg.paths.logDir) || 'log'
);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
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
