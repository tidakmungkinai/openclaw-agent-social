#!/usr/bin/env node
/**
 * Agent Auto-Responder v2
 * Responds to Dany's messages with appropriate agents
 */

import http from 'http';

const API_HOST = '127.0.0.1';
const API_PORT = 18790;

const AGENTS = {
  bang: {
    responses: [
      "Dany, noted. Gue koordinasiin sama tim.",
      "Siap Dany, gue yang handle ini.",
      "Oke Dany, gue cek progressnya dulu ya.",
      "Roger Dany, gue pantau terus.",
      "Dany, sementara gue assign ke tim yang bersangkutan."
    ]
  },
  handal: {
    responses: [
      "Dany, dari data yang gue lihat, market lagi volatile nih.",
      "Bro Dany, BTC resistance di $67k, support $62k.",
      "Dany, sentiment analysis nunjukin bullish momentum.",
      "Gue research dulu ya Dany, nanti gue update.",
      "Dany, on-chain metrics masih positif sih."
    ]
  },
  cermat: {
    responses: [
      "Dany, dari sisi finance kita masih aman.",
      "Bro, budget kita sisa 73% untuk quarter ini.",
      "Dany, risk ratio kita masih di bawah threshold.",
      "Gue sarankan diversifikasi Dany, jangan all-in.",
      "Dany, cash flow kita positif minggu ini."
    ]
  },
  gesit: {
    responses: [
      "Dany! Ada 3 leads baru hari ini! 🚀",
      "Bro, conversion rate naik 15% minggu ini.",
      "Dany, client X lagi negosiasi, kemungkinan closing besar.",
      "Gue follow up leadsnya ya Dany.",
      "Dany, pipeline kita sehat, banyak prospect."
    ]
  },
  astutik: {
    responses: [
      "Dany, system uptime 99.9%, aman.",
      "Bro, deploy terakhir sukses tanpa error.",
      "Dany, gue bisa build itu, ETA 2 hari.",
      "Tech stack kita stabil Dany, no issue.",
      "Dany, kalau butuh integrasi API, gue handle."
    ]
  },
  pedas: {
    responses: [
      "Dany, gue audit nih — ada yang miss deadlines.",
      "Bro, quality control kita harus ditingkatkan.",
      "Dany, gue nemuin beberapa bugs di laporan.",
      "Gue kritik ya — tim perlu lebih disiplin.",
      "Dany, overall ok tapi ada room for improvement."
    ]
  }
};

let lastCount = 0;
let isProcessing = false;

function apiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function getMessages() {
  try {
    const data = await apiRequest('GET', '/api/chat/log?limit=50');
    return data.messages || [];
  } catch (err) {
    console.error('Get messages failed:', err.message);
    return [];
  }
}

async function sendMessage(agent, message) {
  try {
    await apiRequest('POST', '/api/chat/post', { agent, message });
    console.log(`✅ [${agent.toUpperCase()}] ${message.slice(0, 50)}...`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send [${agent}]:`, err.message);
    return false;
  }
}

function getResponse(agent) {
  const responses = AGENTS[agent].responses;
  return responses[Math.floor(Math.random() * responses.length)];
}

function pickAgent() {
  const keys = Object.keys(AGENTS);
  return keys[Math.floor(Math.random() * keys.length)];
}

function pickAgentByMention(text) {
  const lower = text.toLowerCase();
  for (const agent of Object.keys(AGENTS)) {
    if (lower.includes(agent)) return agent;
  }
  return null;
}

async function processMessages() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const messages = await getMessages();
    
    if (messages.length > lastCount) {
      const newMessages = messages.slice(lastCount);
      
      for (const msg of newMessages) {
        // Only respond to Dany's messages
        if (msg.includes('[DANY]')) {
          console.log(`📨 Dany: ${msg.slice(msg.indexOf('] [DANY]') + 8).trim()}`);
          
          // Check if Dany mentioned specific agent
          const mentioned = pickAgentByMention(msg);
          const agent = mentioned || pickAgent();
          
          // Delay 2-5 seconds (realistic typing time)
          await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
          
          const response = getResponse(agent);
          await sendMessage(agent, response);
        }
      }
      
      lastCount = messages.length;
    }
  } catch (err) {
    console.error('Process error:', err.message);
  }

  isProcessing = false;
}

// Random initiative
async function randomChat() {
  if (Math.random() > 0.4) return; // 40% chance every 30 sec
  
  const agent = pickAgent();
  const messages = [
    "Update: Gue lagi monitor situasi nih.",
    "FYI: Gak ada issue signifikan hari ini.",
    "Quick update: Semua system normal.",
    "Info: Gue available kalau ada yang butuh bantuan.",
    "Heads up: Gue lagi kerjain task minggu ini."
  ];
  
  const msg = messages[Math.floor(Math.random() * messages.length)];
  await sendMessage(agent, msg);
}

console.log('═══════════════════════════════════════════');
console.log('  🤖 Agent Auto-Responder v2');
console.log('═══════════════════════════════════════════');
console.log('  Agents will reply when you chat!');
console.log('  Mention: bang, handal, cermat, gesit, astutik, pedas');
console.log('═══════════════════════════════════════════\n');

// Initialize
const init = await getMessages();
lastCount = init.length;
console.log(`📊 Loaded ${lastCount} existing messages`);

// Start loops
setInterval(processMessages, 2000);   // Check every 2 seconds
setInterval(randomChat, 30000);        // Random chat every 30 seconds
