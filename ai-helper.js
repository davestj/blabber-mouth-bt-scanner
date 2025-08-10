const { get } = require('./config');

async function sendMessage(message) {
    const cfg = get().aiProvider || {};
    if (!cfg.name) {
        console.warn('AI provider not configured.');
        return null;
    }

    if (cfg.name === 'ollama') {
        const endpoint = cfg.endpoint || 'http://localhost:11434/api/generate';
        const model = cfg.model || 'llama3';
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt: message })
        });
        if (!res.ok) {
            throw new Error(`Ollama request failed: ${res.status}`);
        }
        return res.json();
    }

    if (cfg.name === 'openai') {
        const endpoint = cfg.endpoint || 'https://api.openai.com/v1/chat/completions';
        const apiKey = cfg.apiKey;
        if (!apiKey) {
            throw new Error('OpenAI API key missing in config');
        }
        const model = cfg.model || 'gpt-4o-mini';
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: message }]
            })
        });
        if (!res.ok) {
            throw new Error(`OpenAI request failed: ${res.status}`);
        }
        return res.json();
    }

    console.warn(`Unsupported AI provider: ${cfg.name}`);
    return null;
}

async function sendScanSummary(summary) {
    return sendMessage(`Scan summary:\n${summary}`);
}

async function sendAnomaly(details) {
    return sendMessage(`Anomaly detected:\n${details}`);
}

module.exports = { sendScanSummary, sendAnomaly };
