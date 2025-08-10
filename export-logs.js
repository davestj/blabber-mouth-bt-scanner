const fs = require('fs');
const path = require('path');

async function exportLogs(outputPath) {
    const dir = path.join(__dirname, 'data');
    try {
        const files = await fs.promises.readdir(dir);
        const logs = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const content = await fs.promises.readFile(path.join(dir, file), 'utf8');
                    logs.push(JSON.parse(content));
                } catch (err) {
                    console.error(`Skipping ${file}: ${err.message}`);
                }
            }
        }
        const output = JSON.stringify(logs, null, 2);
        if (outputPath) {
            await fs.promises.writeFile(outputPath, output);
            console.log(`Exported ${logs.length} logs to ${outputPath}`);
        } else {
            console.log(output);
        }
    } catch (err) {
        console.error(`Failed to export logs: ${err.message}`);
        process.exit(1);
    }
}

const outFile = process.argv[2];
exportLogs(outFile);
