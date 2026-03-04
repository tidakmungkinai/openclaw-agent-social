#!/usr/bin/env node
/**
 * Agent Auto-Responder v3 - Contextual
 */

import http from 'http';

const API_HOST = '127.0.0.1';
const API_PORT = 18790;

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const TOPIC_RESPONSES = {
  btc: ['BTC di $64k, resistance $67k.', 'Bitcoin showing strength hari ini.', 'BTC volume tinggi, watch for breakout.'],
  eth: ['ETH consolidating nicely.', 'Ethereum correlation sama BTC tinggi.', 'ETH showing bullish signals.'],
  crypto: ['Market mixed signals.', 'Crypto volatile hari ini.', 'Several altcoins pumping.'],
  duit: ['Budget masih 70% available.', 'Cash flow positif minggu ini.', 'Burn rate stabil.'],
  uang: ['Finance check: all green.', 'Budget tracking on target.', 'No red flags di finance.'],
  budget: ['Budget healthy.', 'Spending under control.', 'Fiscal space masih ada.'],
  lead: ['Ada 3 leads baru!', 'Pipeline looking good.', 'Conversion rate naik 15%.'],
  client: ['Client X lagi nego.', '2 prospects di follow up.', 'Customer satisfaction tinggi.'],
  sales: ['Sales momentum bagus!', 'Deals di pipeline.', 'Revenue on track.'],
  bug: ['System uptime 99.9%.', 'No critical bugs detected.', 'All services operational.'],
  error: ['Monitoring all green.', 'No errors lately.', 'System stable.'],
  tech: ['Tech stack stabil.', 'Deploy terakhir smooth.', 'No incidents.'],
  build: ['Bisa gue build, ETA 3 hari.', 'Feasible, gue start sekarang.', 'Tech spec clear, gue handle.'],
  koordinasi: ['Gue koordinasiin tim.', 'Gue sync sama tim.', 'Gue assign ke yang bersangkutan.']
};

const AGENT_RESPONSES = {
  bang: ['Dany, noted. Gue koordinasiin.', 'Siap Dany, gue handle.', 'Oke Dany, gue cek progress.', 'Roger Dany, gue pantau.'],
  handal: ['Dany, dari data: market volatile.', 'Dany, BTC analysis: bullish.', 'Gue research dulu ya Dany.', 'On-chain metrics positif.'],
  cermat: ['Dany, finance: all green.', 'Dany, budget tracking ok.', 'Risk ratio di bawah threshold.', 'Cash flow positif minggu ini.'],
  gesit: ['Dany! Ada leads baru! 🎉', 'Dany, pipeline healthy!', 'Conversion rate naik!', 'Gue follow up prospects ya.'],
  astutik: ['Dany, system stabil.', 'Tech stack running smooth.', 'Gue bisa build itu.', 'API integration gue handle.'],
  pedas: ['Dany, gue audit nih.', 'Progress ok tapi bisa faster.', 'Some tasks overdue.', 'Team productive tapi scattered.']
};

let lastCount = 0;
let isProcessing = false;

function apiRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { resolve(body); }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function getMessages() {
  try {
    const data = await apiRequest('GET', '/api/chat/log?limit=30');
    return data.messages || [];
  } catch { return []; }
}

async function sendMessage(agent, message) {
  try {
    await apiRequest('POST', '/api/chat/post', { agent, message });
    console.log(`✅ [${agent.toUpperCase()}] ${message.slice(0, 60)}`);
    return true;
  } catch (err) {
    console.error(`❌ [${agent}] failed:`, err.message);
    return false;
  }
}

function extractTopics(text) {
  const lower = text.toLowerCase();
  return Object.keys(TOPIC_RESPONSES).filter(topic => lower.includes(topic));
}

function extractMentions(text) {
  const lower = text.toLowerCase();
  return Object.keys(AGENT_RESPONSES).filter(agent => lower.includes(agent));
}

async function processMessages() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const messages = await getMessages();
    
    if (messages.length > lastCount) {
      const newMessages = messages.slice(lastCount);
      
      for (const msg of newMessages) {
        const match = msg.match(/\[.*?\]\s*\[(.*?)\]\s*(.+)/);
        if (!match) continue;
        
        const agent = match[1].toLowerCase();
        const text = match[2];
        
        if (agent === 'dany') {
          console.log(`\n📨 Dany: "${text.slice(0, 60)}"`);
          
          const mentions = extractMentions(text);
          const topics = extractTopics(text);
          
          // Pick agent
          let responder;
          if (mentions.length > 0) {
            responder = mentions[0];
          } else if (topics.length > 0) {
            // Map topic to agent
            const topicToAgent = {
              btc: 'handal', eth: 'handal', crypto: 'handal',
              duit: 'cermat', uang: 'cermat', budget: 'cermat',
              lead: 'gesit', client: 'gesit', sales: 'gesit',
              bug: 'astutik', error: 'astutik', tech: 'astutik', build: 'astutik',
              koordinasi: 'bang'
            };
            responder = topicToAgent[topics[0]] || pick(Object.keys(AGENT_RESPONSES));
          } else {
            responder = pick(Object.keys(AGENT_RESPONSES));
          }
          
          // Generate response
          let response;
          if (mentions.length > 0) {
            // Mentioned agent responds with personality
            response = pick(AGENT_RESPONSES[responder]);
          } else if (topics.length > 0) {
            // Topic-based response
            response = pick(TOPIC_RESPONSES[topics[0]]);
          } else {
            response = pick(AGENT_RESPONSES[responder]);
          }
          
          // Delay 2-4 sec
          await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
          await sendMessage(responder, response);
        }
      }
      
      lastCount = messages.length;
    }
  } catch (err) {
    console.error('Error:', err.message);
  }

  isProcessing = false;
}

console.log('═══════════════════════════════════════════');
console.log('  🤖 Smart Agent Auto-Responder v3');
console.log('═══════════════════════════════════════════');
console.log('  Agents now understand topics!');
console.log('  Try: "btc", "duit", "lead", "bug"');
console.log('═══════════════════════════════════════════\n');

const init = await getMessages();
lastCount = init.length;
console.log(`📊 Loaded ${lastCount} messages\n`);

setInterval(processMessages, 1500);
