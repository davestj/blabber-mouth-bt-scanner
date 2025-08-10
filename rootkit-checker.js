const { exec } = require('child_process');
const logger = require('./logger');

function runRootkitCheck() {
    return new Promise(resolve => {
        exec('chkrootkit', (error, stdout, stderr) => {
            if (error) {
                logger.error(`Rootkit check failed: ${error.message}`);
                resolve({ status: 'error', output: stderr || error.message });
                return;
            }
            logger.info('Rootkit check completed');
            logger.info(stdout.trim());
            resolve({ status: 'ok', output: stdout });
        });
    });
}

module.exports = { runRootkitCheck };
