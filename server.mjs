import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRgEuNnmETcuMt1BrMtTHavfvoi8NavY0MEkFtBYdDB_pqW-p1pZTutXb7ipmjeWZPGYrOJlMWHle8m/pub?output=csv';
let lastGoodCsv = '';
let lastSuccessfulSync = '';

function send(response, status, contentType, body, extraHeaders = {}) {
    response.writeHead(status, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        ...extraHeaders
    });
    response.end(body);
}

async function serveCsv(response) {
    try {
        const upstream = await fetch(csvUrl, {
            cache: 'no-store',
            signal: AbortSignal.timeout(12000),
            headers: { 'User-Agent': 'GrupoBaseConventionDashboard/1.0' }
        });
        if (!upstream.ok) throw new Error(`Google Sheets respondeu HTTP ${upstream.status}`);

        const csv = await upstream.text();
        if (!csv.trim() || /^\s*</.test(csv)) throw new Error('Google Sheets não retornou um CSV válido.');

        lastGoodCsv = csv;
        lastSuccessfulSync = new Date().toISOString();
        send(response, 200, 'text/csv; charset=utf-8', csv, {
            'X-Data-Source': 'google-sheets',
            'X-Last-Successful-Sync': lastSuccessfulSync
        });
    } catch (error) {
        console.error(`[sincronizacao] ${error.message}`);
        if (lastGoodCsv) {
            send(response, 200, 'text/csv; charset=utf-8', lastGoodCsv, {
                'X-Data-Source': 'server-cache',
                'X-Data-Stale': 'true',
                'X-Last-Successful-Sync': lastSuccessfulSync
            });
            return;
        }

        send(response, 502, 'application/json; charset=utf-8', JSON.stringify({
            error: 'Não foi possível acessar o Google Sheets e ainda não há uma cópia válida em cache.'
        }));
    }
}

const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (request.method !== 'GET') {
        send(response, 405, 'text/plain; charset=utf-8', 'Método não permitido.');
        return;
    }

    if (pathname === '/api/responses') {
        await serveCsv(response);
        return;
    }

    try {
        if (pathname === '/vendor/papaparse.min.js') {
            const scriptPath = join(root, 'node_modules', 'papaparse', 'papaparse.min.js');
            send(response, 200, 'text/javascript; charset=utf-8', await readFile(scriptPath));
            return;
        }
        if (pathname === '/' || pathname === '/index.html') {
            send(response, 200, 'text/html; charset=utf-8', await readFile(join(root, 'index.html')));
            return;
        }
        send(response, 404, 'text/plain; charset=utf-8', 'Não encontrado.');
    } catch (error) {
        console.error(`[servidor] ${error.message}`);
        send(response, 500, 'text/plain; charset=utf-8', 'Erro ao carregar o dashboard.');
    }
});

server.listen(port, '0.0.0.0', () => {
    console.log(`Dashboard disponível neste computador: http://localhost:${port}`);
    for (const addresses of Object.values(networkInterfaces())) {
        for (const address of addresses || []) {
            if (address.family === 'IPv4' && !address.internal) {
                console.log(`Dashboard na rede local: http://${address.address}:${port}`);
            }
        }
    }
});
