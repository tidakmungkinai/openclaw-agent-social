#!/usr/bin/env node
/**
 * Multi-Agent Router v5 - Smart Orchestration
 * Bang routes messages, agents respond appropriately
 */

import http from 'http';

const API_HOST = '127.0.0.1';
const API_PORT = 18790;

// Agent configs
const AGENTS = {
  gesit: {
    role: 'sales',
    triggers: ['lead', 'client', 'sales', 'deal', 'customer', 'prospect'],
    respondTo: ['dany', 'pedas'], // Respond to Dany and criticism from Pedas
    cooldown: 25000 // 25s - faster for criticism response
  },
  handal: {
    role: 'research',
    triggers: ['btc', 'eth', 'crypto', 'market', 'analysis', 'data'],
    respondTo: ['dany', 'pedas'],
    cooldown: 45000
  },
  cermat: {
    role: 'finance',
    triggers: ['budget', 'duit', 'uang', 'finance', 'cost', 'risk', 'roi'],
    respondTo: ['dany', 'pedas'],
    cooldown: 45000
  },
  pedas: {
    role: 'critic',
    triggers: ['audit', 'review', 'check', 'problem', 'issue', 'warning'],
    respondTo: ['dany', 'gesit', 'handal', 'cermat', 'bang'], // Audit everyone
    cooldown: 60000 // 60s - less frequent
  },
  bang: {
    role: 'orchestrator',
    triggers: ['all', 'summary', 'action', 'plan', 'koordinasi'],
    respondTo: ['dany', 'all'], // Respond to Dany and summarize for all
    cooldown: 30000 // 30s
  }
};

const RESPONSES = {
  gesit: {
    toDany: [
      "Dany! 🚀 Ada 3 leads hot: 2 LinkedIn, 1 referral. Conversion rate naik 15%!",
      "Bos, pipeline sehat. Client X di negotiation stage, deal potential $50k.",
      "Update sales: 2 deals closing minggu ini, 3 prospects warming up!"
    ],
    toPedas: [
      "Pedas, valid kritiknya. Source data: CRM HubSpot, last update 2 jam lalu. Mau gue export raw data?",
      "Siap Pedas, gue attach screenshot leads di thread ini. Evidence ready.",
      "Fair point Pedas. Gue clarify: '3 leads' = qualified leads, bukan inquiry. Conversion dari inquiry ke qualified = 12%."
    ],
    toHandal: ["Handal, client crypto minta research. Bisa bantu analysis?"],
    toCermat: ["Cermat, deal size $50k. Budget approval needed?"]
  },
  handal: {
    toDany: [
      "Dany, BTC di $64k. Support $62k hold, resistance $67k. Volume stabil.",
      "Market analysis: Bullish divergence 4H timeframe. Whale activity +15%.",
      "ETH showing strength $3.4k. Correlation BTC masih 0.85."
    ],
    toPedas: [
      "Pedas, source data: CoinGecko API + Glassnode on-chain. Timestamp 08:45 WIB.",
      "Valid concern Pedas. 'Whale activity' = wallet >1000 BTC movement. Gue attach chart.",
      "Siap Pedas, gue clarify methodology. Data 7-day rolling average, bukan spot."
    ]
  },
  cermat: {
    toDany: [
      "Dany, budget tracking: 73% available Q1. Burn rate stabil di $12k/mo.",
      "Finance check: Cash flow positif $45k. Emergency fund 6 bulan intact.",
      "Risk assessment: Portfolio 65% crypto, above comfort zone 50%."
    ],
    toPedas: [
      "Pedas, valid. Breakdown: Revenue $89k, Expense $44k, Net $45k. Monthly report attached.",
      "Fair point Pedas. 'Risk ratio' = (debt+liability)/asset = 0.32 (threshold 0.4).",
      "Siap audit Pedas. Source: QuickBooks + Bank statement. Gue open book."
    ]
  },
  pedas: {
    toAll: [
      "🔥 AUDIT TIME: @gesit @handal @cermat - Gue lihat data inconsistencies. Clarify source untuk claims kemarin!",
      "⚠️ WARNING: Diskusi 20+ pesan tapi gak ada action items konkret. Bang, tolong summarize!",
      "📊 QUALITY CHECK: @gesit '3 leads' - qualified atau inquiry? @handal 'whale activity' - definisinya?"
    ],
    toGesit: ["@gesit: 'Conversion naik 15%' - baseline dari kapan? Control group? Jangan asal claim!"],
    toHandal: ["@handal: 'Support $62k' - tested berapa kali? Volume di level itu sufficient?"],
    toCermat: ["@cermat: 'Cash flow positif' - include account receivable aging? Jangan premature conclusion."]
  },
  bang: {
    toDany: [
      "Dany, gue rangkumin ya: Gesit ada leads baru, Handal bullish BTC, Cermat bilang budget aman. Action item: Validate leads dulu.",
      "Siap Dany. Gue koordinasiin: Gesit kirim lead details, Handal prepare risk assessment, Cermat review cash flow. ETA 2 jam.",
      "Dany, diskusi panjang nih. Summary: 3 leads (Gesit), BTC support (Handal), budget ok (Cermat). Next step: Focus leads validation."
    ],
    summary: [
      "📋 ACTION ITEMS:\n1. @gesit - Export lead details ke spreadsheet\n2. @handal - Verify BTC support dengan volume data\n3. @cermat - Breakdown cash flow components\n\nDeadline: Besok 12:00 WIB",
      "🎯 PRIORITY:\nHIGH: Leads validation (Gesit)\nMEDIUM: Market analysis confirm (Handal)\nLOW: Budget detail (Cermat)\n\n@all - Confirm receipt."
    ]
  }
};

const lastResponse = {};
const processedMsgs = new Set();

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function canRespond(agent) {
  const now = Date.now();
  const last = lastResponse[agent] || 0;
  const cooldown = AGENTS[agent]?.cooldown || 30000;
  if (now - last < cooldown) return false;
  lastResponse[agent] = now;
  return true;
}

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
    console.log(`✅ [${agent.toUpperCase()}] ${message.slice(0, 60)}...`);
    return true;
  } catch (err) {
    console.error(`❌ [${agent}] failed:`, err.message);
    return false;
  }
}

function parseMessage(msg) {
  const match = msg.match(/\[(.*?)\]\s*\[(.*?)\]\s*(.+)/);
  if (!match) return null;
  return { time: match[1], agent: match[2].toLowerCase(), text: match[3] };
}

function extractMentions(text) {
  const lower = text.toLowerCase();
  const mentions = [];
  for (const agent of Object.keys(AGENTS)) {
    if (lower.includes(`@${agent}`) || lower.includes(agent)) {
      mentions.push(agent);
    }
  }
  return mentions;
}

function shouldRespond(agent, parsed, mentions) {
  const { agent: fromAgent, text } = parsed;
  
  // 1. If specifically mentioned, respond
  if (mentions.includes(agent)) return true;
  
  // 2. Pedas responds to everyone (critic role)
  if (agent === 'pedas' && fromAgent !== 'pedas') {
    // Only if there's something to audit
    return ['gesit', 'handal', 'cermat'].includes(fromAgent);
  }
  
  // 3. Bang responds to Dany or summarizes
  if (agent === 'bang') {
    return fromAgent === 'dany' || (fromAgent === 'pedas' && text.includes('action'));
  }
  
  // 4. Other agents only respond to Dany (not to each other, unless mentioned)
  if (fromAgent === 'dany') {
    // Check if triggers match
    const triggers = AGENTS[agent].triggers;
    const lower = text.toLowerCase();
    return triggers.some(t => lower.includes(t));
  }
  
  return false;
}

async function processMessages() {
  try {
    const messages = await getMessages();
    
    for (const msg of messages) {
      if (processedMsgs.has(msg)) continue;
      processedMsgs.add(msg);
      
      const parsed = parseMessage(msg);
      if (!parsed) continue;
      
      const { agent: fromAgent, text } = parsed;
      
      // Skip if from system or unknown
      if (!AGENTS[fromAgent] && fromAgent !== 'dany') continue;
      
      console.log(`\n📨 [${fromAgent.toUpperCase()}]: "${text.slice(0, 50)}"`);
      
      const mentions = extractMentions(text);
      console.log(`   Mentions: ${mentions.length > 0 ? mentions.join(', ') : 'none'}`);
      
      // Determine who should respond
      const responders = [];
      
      for (const agent of Object.keys(AGENTS)) {
        if (agent === fromAgent) continue; // Don't respond to self
        
        if (shouldRespond(agent, parsed, mentions)) {
          responders.push(agent);
        }
      }
      
      console.log(`   Should respond: ${responders.length > 0 ? responders.join(', ') : 'none'}`);
      
      // Send responses (with delay between each)
      for (const agent of responders) {
        if (!canRespond(agent)) {
          console.log(`   ⏳ [${agent.toUpperCase()}] on cooldown`);
          continue;
        }
        
        // Determine response type
        let responseType = 'toDany';
        if (fromAgent === 'pedas') responseType = `to${fromAgent.charAt(0).toUpperCase() + fromAgent.slice(1)}`;
        if (fromAgent === 'dany' && mentions.includes(agent)) responseType = 'toDany';
        
        // Get response
        let response;
        if (agent === 'bang' && parsed.text.length > 100 && RESPONSES.bang.summary) {
          response = pick(RESPONSES.bang.summary);
        } else {
          const agentResponses = RESPONSES[agent];
          if (agentResponses[responseType] && agentResponses[responseType].length > 0) {
            response = pick(agentResponses[responseType]);
          } else if (agentResponses.toDany && agentResponses.toDany.length > 0) {
            response = pick(agentResponses.toDany);
          } else {
            response = "Received. Gue cek dulu ya.";
          }
        }
        
        // Delay before responding (2-5 seconds)
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 3000));
        await sendMessage(agent, response);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

console.log('═══════════════════════════════════════════');
console.log('  🤖 Multi-Agent Router v5 (Orchestrated)');
console.log('═══════════════════════════════════════════');
console.log('  Bang routes, agents respond smartly');
console.log('  Mention @agent or all agents respond');
console.log('  Pedas audits, others defend');
console.log('═══════════════════════════════════════════\n');

// Initial load
const init = await getMessages();
init.forEach(m => processedMsgs.add(m));
console.log(`📊 Loaded ${init.length} messages\n`);

// Loop
setInterval(processMessages, 2000);
