#!/usr/bin/env node
/**
 * Clawd Office Chat API Server
 * Provides POST endpoint for agents to send messages to group chat
 * Port: 18790 (localhost only)
 */

import express from 'express';
import { appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Config
const PORT = 18790;
const CHAT_FILE = '/Users/danyarkham/clawd/memory/clawd-office-chat.md';
const VALID_AGENTS = ['handal', 'cermat', 'gesit', 'astutik', 'pedas', 'bang'];

const app = express();

// Middleware
app.use(express.json());

// Security: Only accept from localhost
app.use((req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const forwarded = req.headers['x-forwarded-for'];
  
  // Allow localhost only
  const isLocalhost = 
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp === '::ffff:127.0.0.1' ||
    req.socket.localAddress === clientIp;
  
  if (!isLocalhost && !clientIp.includes('127.0.0.1')) {
    console.log(`[SECURITY] Rejected request from: ${clientIp} (forwarded: ${forwarded})`);
    return res.status(403).json({ error: 'forbidden - localhost only' });
  }
  
  next();
});

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'clawd-office-chat-api',
    timestamp: new Date().toISOString()
  });
});

// Main endpoint: POST /api/office-chat/post
app.post('/api/office-chat/post', (req, res) => {
  const { agent, message } = req.body;
  
  // Validate agent
  if (!agent || !VALID_AGENTS.includes(agent.toLowerCase())) {
    return res.status(400).json({ 
      error: 'invalid agent',
      validAgents: VALID_AGENTS
    });
  }
  
  // Validate message
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ 
      error: 'invalid message',
      detail: 'message must be a non-empty string'
    });
  }
  
  const normalizedAgent = agent.toLowerCase();
  const trimmedMessage = message.trim();
  
  // Generate timestamp in WIB (UTC+7)
  const now = new Date();
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // Add 7 hours for WIB
  const timestamp = wibTime.toISOString()
    .replace('T', ' ')
    .slice(0, 16); // YYYY-MM-DD HH:MM
  
  // Format: [YYYY-MM-DD HH:MM WIB] [AGENT] message
  const formattedLine = `[${timestamp} WIB] [${normalizedAgent.toUpperCase()}] ${trimmedMessage}\n`;
  
  try {
    // Append to file
    appendFileSync(CHAT_FILE, formattedLine);
    
    console.log(`✅ Message appended: ${formattedLine.trim()}`);
    
    // Response
    res.json({
      success: true,
      timestamp: `${timestamp} WIB`,
      agent: normalizedAgent,
      message: trimmedMessage
    });
    
    // Note: Watcher will automatically detect file change and broadcast to agents
    
  } catch (err) {
    console.error(`❌ Failed to append message: ${err.message}`);
    res.status(500).json({
      error: 'failed to write message',
      detail: err.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'internal server error' });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  🤖 Clawd Office Chat API Server');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Port: ${PORT}`);
  console.log(`  Bind: 127.0.0.1 (localhost only)`);
  console.log(`  Chat File: ${CHAT_FILE}`);
  console.log(`  Valid Agents: ${VALID_AGENTS.join(', ')}`);
  console.log('═══════════════════════════════════════════════════');
  console.log('  Endpoints:');
  console.log(`    GET  /health`);
  console.log(`    POST /api/office-chat/post`);
  console.log('═══════════════════════════════════════════════════');
  console.log('  Ready to accept connections...');
  console.log('');
});
