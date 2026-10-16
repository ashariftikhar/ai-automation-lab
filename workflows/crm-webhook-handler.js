/**
 * Inbound CRM Webhook Handler
 * Ashflow AI Automation Lab
 *
 * Lightweight HTTP webhook listener using native Node.js 'http' module.
 * Receives inbound leads via POST, executes multi-dimensional AI scoring,
 * and logs real-time decision metrics for CRM sync.
 */

'use strict';

const http = require('node:http');
const { URL } = require('node:url');
const { evaluateLead } = require('../tools/lead-scoring-engine.js');

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1 MB payload limit

/**
 * Parses JSON request body asynchronously
 * @param {http.IncomingMessage} req
 * @returns {Promise<Object>}
 */
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let rawData = '';
    let size = 0;

    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_PAYLOAD_SIZE) {
        req.destroy();
        reject(new Error('Payload too large: exceeds 1 MB'));
        return;
      }
      rawData += chunk;
    });

    req.on('end', () => {
      if (!rawData || rawData.trim() === '') {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(rawData);
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Invalid JSON syntax: ${err.message}`));
      }
    });

    req.on('error', err => {
      reject(err);
    });
  });
}

/**
 * Send JSON HTTP response
 * @param {http.ServerResponse} res
 * @param {number} statusCode
 * @param {Object} payload
 */
function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Powered-By': 'Ashflow-AI-Automation-Suite'
  });
  res.end(body);
}

/**
 * Handle incoming HTTP requests
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
async function handleRequest(req, res) {
  const host = req.headers.host || 'localhost';
  const parsedUrl = new URL(req.url, `http://${host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (method === 'GET' && (pathname === '/' || pathname === '/health' || pathname === '/api/health')) {
    sendJson(res, 200, {
      status: 'healthy',
      service: 'Ashflow AI Automation Lab - CRM Webhook Handler',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      routes: {
        'POST /webhook/lead': 'Inbound lead scoring endpoint',
        'POST /api/leads': 'Alternative lead evaluation endpoint',
        'GET /health': 'Service health status'
      }
    });
    return;
  }

  // Inbound Lead Webhook endpoint
  if (method === 'POST' && (pathname === '/webhook/lead' || pathname === '/api/leads' || pathname === '/webhook' || pathname === '/')) {
    try {
      const body = await parseJsonBody(req);

      // Support payload wrapped in { lead: { ... } } or flat payload
      const leadPayload = (body && typeof body.lead === 'object') ? body.lead : body;

      const evaluation = evaluateLead(leadPayload);
      const leadId = body.leadId || body.id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const timestamp = new Date().toISOString();

      // Console audit log
      const logIcon = evaluation.disqualified ? '🚫' : (evaluation.category === 'HOT' ? '🔥' : (evaluation.category === 'WARM' ? '⚡' : '❄️'));
      console.log(`[CRM-WEBHOOK] ${timestamp} | ${logIcon} [${evaluation.category}] | ID: ${leadId} | "${evaluation.lead.name}" (${evaluation.lead.company})`);
      console.log(`              Score: ${evaluation.score}/100 | Action: "${evaluation.action}" | SLA: ${evaluation.sla}`);

      sendJson(res, 200, {
        success: true,
        message: 'Lead scored and classified successfully',
        leadId,
        timestamp,
        evaluation: {
          score: evaluation.score,
          category: evaluation.category,
          disqualified: evaluation.disqualified,
          disqualificationReason: evaluation.disqualificationReason,
          action: evaluation.action,
          sla: evaluation.sla,
          channel: evaluation.channel,
          priority: evaluation.priority,
          breakdown: evaluation.breakdown,
          lead: evaluation.lead
        }
      });
    } catch (err) {
      console.error(`[CRM-WEBHOOK-ERROR] ${new Date().toISOString()} | ${err.message}`);
      sendJson(res, 400, {
        success: false,
        error: 'Bad Request',
        message: err.message
      });
    }
    return;
  }

  // Method not allowed or route not found
  if (pathname === '/webhook/lead' || pathname === '/api/leads') {
    sendJson(res, 405, {
      success: false,
      error: 'Method Not Allowed',
      message: `HTTP ${method} is not supported on ${pathname}. Use POST.`
    });
    return;
  }

  sendJson(res, 404, {
    success: false,
    error: 'Not Found',
    message: `Endpoint ${pathname} not found. Inbound leads must be sent to POST /webhook/lead.`
  });
}

/**
 * Creates the HTTP server instance
 * @returns {http.Server}
 */
function createServer() {
  return http.createServer(handleRequest);
}

/**
 * Starts the HTTP server on a specified port
 * @param {number} [port]
 * @returns {http.Server}
 */
function startServer(port = DEFAULT_PORT) {
  const server = createServer();
  server.listen(port, () => {
    console.log(`\n================================================================`);
    console.log(`🚀 Ashflow CRM Webhook Listener ACTIVE on port ${port}`);
    console.log(`📥 Inbound Endpoint: POST http://localhost:${port}/webhook/lead`);
    console.log(`💓 Health Check:     GET  http://localhost:${port}/health`);
    console.log(`================================================================\n`);
  });
  return server;
}

// Start immediately if executed directly
if (require.main === module) {
  startServer();
}

module.exports = {
  createServer,
  startServer,
  handleRequest,
  parseJsonBody,
  DEFAULT_PORT
};
