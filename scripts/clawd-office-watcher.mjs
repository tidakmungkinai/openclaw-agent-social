#!/usr/bin/env node
/**
 * Clawd Office Event Watcher
 * Monitors clawd-office-chat.md and triggers broadcast on change
 * Zero polling — 100% event driven
 */

import { watch } from 'fs';
import { readFileSync, statSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Config
const CHAT_FILE = '/Users/danyarkham/clawd/memory/clawd-office-chat.md';
const DEBOUNCE_MS = 5000; // Wait 5s for batching
const AGENTS = ['handal', 'cermat', 'gesit', 'astutik', 'pedas'];

let lastProcessedTime = Date.now();
let debounceTimer = null;
let isProcessing = false;

function log(message) {
  const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${time}] ${message}`);
}

async function getLastMessage() {
  try {
    const content = readFileSync(CHAT_FILE, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    const lastLine = lines[lines.length - 1];
    return lastLine || null;
  } catch (err) {
    return null;
  }
}

async function broadcastToAgents() {
  if (isProcessing) {
    log('⚠️  Still processing previous broadcast, skipping...');
    return;
  }
  
  isProcessing = true;
  const lastMessage = await getLastMessage();
  
  if (!lastMessage) {
    log('⚠️  No messages found');
    isProcessing = false;
    return;
  }
  
  log(`📢 Broadcasting: ${lastMessage.slice(0, 60)}...`);
  
  // Broadcast to each agent via openclaw sessions_send
  for (const agent of AGENTS) {
    try {
      const message = `New message in Clawd Office Group Chat:\n${lastMessage}\n\nCheck memory/clawd-office-chat.md for full context. Reply if relevant, ignore if not.`;
      
      await execAsync(
        `openclaw sessions send --agent ${agent} "${message.replace(/"/g, '\\"')}"`,
        { timeout: 10000 }
      );
      
      log(`✓ Notified ${agent}`);
    } catch (err) {
      log(`✗ Failed to notify ${agent}: ${err.message}`);
    }
  }
  
  lastProcessedTime = Date.now();
  isProcessing = false;
  log('✅ Broadcast complete');
}

function onFileChange(eventType) {
  if (eventType !== 'change') return;
  
  log(`📝 File changed (${eventType})`);
  
  // Debounce: reset timer if already pending
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  // Wait for batching multiple rapid writes
  debounceTimer = setTimeout(() => {
    broadcastToAgents();
  }, DEBOUNCE_MS);
}

// Main
async function main() {
  log('🚀 Clawd Office Event Watcher started');
  log(`📁 Monitoring: ${CHAT_FILE}`);
  log(`⏱️  Debounce: ${DEBOUNCE_MS}ms`);
  log(`👥 Agents: ${AGENTS.join(', ')}`);
  log('');
  
  // Check file exists
  try {
    statSync(CHAT_FILE);
  } catch (err) {
    log(`✗ File not found: ${CHAT_FILE}`);
    process.exit(1);
  }
  
  // Start watching
  const watcher = watch(CHAT_FILE, (eventType) => {
    onFileChange(eventType);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    log('\n👋 Shutting down watcher...');
    watcher.close();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('\n👋 Shutting down watcher...');
    watcher.close();
    process.exit(0);
  });
  
  log('✅ Watching for changes... (Press Ctrl+C to stop)');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
