#!/usr/bin/env node
/**
 * Simple Agent Auto-Responder
 * Runs in background, responds to Dany's messages
 */

const AGENTS = {
  bang: {
    name: 'Bang',
    color: '\x1b[91m',
    responses: [
      "Dany, noted. Gue koordinasiin sama tim.",
      "Siap Dany, gue yang handle ini.",
      "Oke Dany, gue cek progressnya dulu ya.",
      "Dany, sementara gue assign ke Handal untuk research.",
      "Roger Dany, gue pantau terus."
    ]
  },
  handal: {
    name: 'Handal', 
    color: '\x1b[96m',
    responses: [
      "Dany, dari data yang gue lihat, market lagi volatile nih.",
      "Bro Dany, BTC resistance di $67k, support $62k.",
      "Dany, sentiment analysis nunjukin bullish momentum.",
      "Gue research dulu ya Dany, nanti gue update.",
      "Dany, on-chain metrics masih positif sih."
    ]
  },
  cermat: {
    name: 'Cermat',
    color: '\x1b[93m', 
    responses: [
      "Dany, dari sisi finance kita masih aman.",
      "Bro, budget kita sisa 73% untuk quarter ini.",
      "Dany, risk ratio kita masih di bawah threshold.",
      "Gue sarankan diversifikasi Dany, jangan all-in.",
      "Dany, cash flow kita positif minggu ini."
    ]
  },
  gesit: {
    name: 'Gesit',
    color: '\x1b[95m',
    responses: [
      "Dany, ada 3 leads baru hari ini!",
      "Bro, conversion rate naik 15% minggu ini.",
      "Dany, client X lagi negosiasi, kemungkinan closing besar.",
      "Gue follow up leadsnya ya Dany.",
      "Dany, pipeline kita sehat, banyak prospect."
    ]
  },
  astutik: {
    name: 'Astutik',
    color: '\x1b[95m',
    responses: [
      "Dany, system uptime 99.9%, aman.",
      "Bro, deploy terakhir sukses tanpa error.",
      "Dany, gue bisa build itu, ETA 2 hari.",
      "Tech stack kita stabil Dany, no issue.",
      "Dany, kalau butuh integrasi API, gue handle."
    ]
  },
  pedas: {
    name: 'Pedas',
    color: '\x1b[35m',
    responses: [
      "Dany, gue audit nih — ada yang miss deadlines.",
      "Bro, quality control kita harus ditingkatkan.",
      "Dany, gue nemuin beberapa bugs di laporan.",
      "Gue kritik ya — tim perlu lebih disiplin.",
      "Dany, overall ok tapi ada room for improvement."
    ]
  }
};

let lastMessageCount = 0;
let lastMessageContent = '';

async function getMessages() {
  try {
    const res = await fetch('http://127.0.0.1:18790/api/chat/log?limit=50');
    const data = await res.json();
    return data.messages || [];
  } catch (err) {
    return [];
  }
}

async function sendMessage(agent, message) {
  try {
    await fetch('http://127.0.0.1:18790/api/chat/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent, message })
    });
    console.log(`${AGENTS[agent].color}[${agent.toUpperCase()}]\x1b[0m ${message.slice(0, 60)}...`);
  } catch (err) {
    console.error('Failed to send:', err.message);
  }
}

function getRandomResponse(agent) {
  const responses = AGENTS[agent].responses;
  return responses[Math.floor(Math.random() * responses.length)];
}

function pickAgent() {
  const keys = Object.keys(AGENTS);
  return keys[Math.floor(Math.random() * keys.length)];
}

async function checkAndRespond() {
  const messages = await getMessages();
  
  // Check if there are new messages
  if (messages.length > lastMessageCount) {
    const newMessages = messages.slice(lastMessageCount);
    
    for (const msg of newMessages) {
      // Check if message is from Dany
      if (msg.includes('[DANY]')) {
        console.log('\x1b[94m[DETECTED]\x1b[0m Dany sent message:', msg.slice(0, 80));
        
        // Wait 2-4 seconds then respond
        const delay = 2000 + Math.random() * 2000;
        await new Promise(r => setTimeout(r, delay));
        
        // Pick random agent to respond
        const agent = pickAgent();
        const response = getRandomResponse(agent);
        await sendMessage(agent, response);
      }
    }
    
    lastMessageCount = messages.length;
    lastMessageContent = messages[messages.length - 1] || '';
  }
}

// Random initiative (agents chat randomly)
async function randomInitiative() {
  if (Math.random() < 0.3) { // 30% chance
    const agent = pickAgent();
    const initiatives = [
      "Update: Gue lagi monitor situasi nih.",
      "FYI: Gak ada issue signifikan hari ini.",
      "Heads up: Gue lagi kerjain task minggu ini.",
      "Quick update: Semua system normal.",
      "Info: Gue available kalau ada yang butuh bantuan."
    ];
    const msg = initiatives[Math.floor(Math.random() * initiatives.length)];
    await sendMessage(agent, msg);
  }
}

console.log('═══════════════════════════════════════════');
console.log('  🤖 Agent Auto-Responder Started');
console.log('═══════════════════════════════════════════');
console.log('  Agents will respond when Dany chats');
console.log('  Press Ctrl+C to stop');
console.log('═══════════════════════════════════════════\n');

// Initial load
const initial = await getMessages();
lastMessageCount = initial.length;

// Main loop
setInterval(checkAndRespond, 3000);  // Check every 3 seconds
setInterval(randomInitiative, 30000); // Random chat every 30 seconds
