#!/usr/bin/env node
/**
 * Multi-Agent Social Protocol - Standalone API Server
 * Works with or without OpenClaw
 * Port: 18790 (configurable via PORT env var)
 */

import express from 'express';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Config
const PORT = process.env.PORT || 18790;
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = process.env.DATA_DIR || join(PROJECT_ROOT, 'data');
const CHAT_FILE = join(DATA_DIR, 'chat-log.md');
const VALID_AGENTS = (process.env.AGENTS || 'dany,handal,cermat,gesit,astutik,pedas,bang').split(',');
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize chat file if doesn't exist
if (!existsSync(CHAT_FILE)) {
  appendFileSync(CHAT_FILE, '# 🤖 Agent Chat Log\n\n');
}

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(join(PROJECT_ROOT, 'public')));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'agent-social-protocol',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    agents: VALID_AGENTS
  });
});

// Get chat log
app.get('/api/chat/log', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const content = readFileSync(CHAT_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const messages = lines.slice(-limit);
    
    res.json({
      messages,
      total: lines.length,
      limit
    });
  } catch (err) {
    res.status(500).json({ error: 'failed to read chat log', detail: err.message });
  }
});

// Post message
app.post('/api/chat/post', (req, res) => {
  const { agent, message, metadata } = req.body;
  
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
  
  // Generate timestamp
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 16);
  
  // Format message
  let formattedLine = `[${timestamp}] [${normalizedAgent.toUpperCase()}] ${trimmedMessage}`;
  if (metadata) {
    formattedLine += ` | ${JSON.stringify(metadata)}`;
  }
  formattedLine += '\n';
  
  try {
    appendFileSync(CHAT_FILE, formattedLine);
    
    console.log(`✅ ${normalizedAgent}: ${trimmedMessage.slice(0, 60)}...`);
    
    res.json({
      success: true,
      timestamp,
      agent: normalizedAgent,
      message: trimmedMessage
    });
    
  } catch (err) {
    console.error(`❌ Failed to append: ${err.message}`);
    res.status(500).json({
      error: 'failed to write message',
      detail: err.message
    });
  }
});

// Agent list
app.get('/api/agents', (req, res) => {
  const agents = VALID_AGENTS.map(name => ({
    id: name,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    role: getAgentRole(name)
  }));
  
  res.json({ agents });
});

function getAgentRole(name) {
  const roles = {
    dany: 'User',
    bang: 'Orchestrator',
    handal: 'Research',
    cermat: 'Finance',
    gesit: 'Sales',
    astutik: 'Engineering',
    pedas: 'Critic'
  };
  return roles[name] || 'Agent';
}

// Clear chat
app.delete('/api/chat/clear', (req, res) => {
  try {
    writeFileSync(CHAT_FILE, '# 🤖 Agent Chat Log\n\n');
    console.log('🗑️ Chat cleared');
    res.json({ success: true, message: 'Chat cleared' });
  } catch (err) {
    res.status(500).json({ error: 'failed to clear chat', detail: err.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'internal server error' });
});

// Start
app.listen(PORT, HOST, () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  🤖 Multi-Agent Social Protocol');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Port:    ${PORT}`);
  console.log(`  Host:    ${HOST}`);
  console.log(`  Data:    ${DATA_DIR}`);
  console.log(`  Agents:  ${VALID_AGENTS.join(', ')}`);
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Web UI:  http://${HOST}:${PORT}/`);
  console.log(`  API:     http://${HOST}:${PORT}/api/chat/post`);
  console.log('═══════════════════════════════════════════════════');
});
