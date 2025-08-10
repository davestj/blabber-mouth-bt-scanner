const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const baselineFile = path.join(__dirname, 'data', 'file-baseline.json');

function getAllFiles(dir, fileList = []) {
    const entries = fs.readdirSync(dir);
    entries.forEach(entry => {
        if (['node_modules', '.git', 'data', 'log'].includes(entry)) {
            return;
        }
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            getAllFiles(fullPath, fileList);
        } else {
            fileList.push(fullPath);
        }
    });
    return fileList;
}

function hashFile(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

function createBaseline(targetDir) {
    const files = getAllFiles(targetDir);
    const hashes = {};
    files.forEach(file => {
        hashes[path.relative(targetDir, file)] = hashFile(file);
    });
    fs.writeFileSync(baselineFile, JSON.stringify({ targetDir, hashes }, null, 2));
    logger.info(`File baseline created for ${targetDir}`);
    return hashes;
}

function checkIntegrity(targetDir) {
    if (!fs.existsSync(baselineFile)) {
        logger.warn('Baseline file missing, integrity check skipped');
        return { status: 'missing-baseline', changed: [] };
    }
    const baseline = JSON.parse(fs.readFileSync(baselineFile));
    const files = getAllFiles(targetDir);
    const current = {};
    files.forEach(file => {
        current[path.relative(targetDir, file)] = hashFile(file);
    });
    const changed = [];
    Object.keys(baseline.hashes).forEach(file => {
        if (current[file] !== baseline.hashes[file]) {
            changed.push(file);
        }
    });
    logger.info(`Integrity check complete: ${changed.length} files changed`);
    return { status: 'ok', changed };
}

module.exports = { createBaseline, checkIntegrity, baselineFile };
