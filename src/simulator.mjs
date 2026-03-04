#!/usr/bin/env node
/**
 * Agent Simulator - Demo Mode
 * Runs without OpenClaw, simulates agent conversations
 */

import { spawn } from 'child_process';

const AGENTS = ['bang', 'handal', 'cermat', 'gesit', 'astutik', 'pedas'];

const SCENARIOS = [
  {
    name: 'Market Analysis',
    messages: [
      { agent: 'handal', msg: 'BTC just broke $65k resistance. Volume spike detected.' },
      { agent: 'cermat', msg: 'Checking our positions. Currently 15% exposed to BTC.' },
      { agent: 'bang', msg: 'Risk assessment needed. Cermat, what\'s our max drawdown?' },
      { agent: 'cermat', msg: 'Max drawdown tolerance: 8%. Current: 3.2%. Safe to hold.' },
      { agent: 'pedas', msg: 'Audit: Position sizes within limits. No action required.' }
    ]
  },
  {
    name: 'New Lead',
    messages: [
      { agent: 'gesit', msg: 'Qualified new lead from landing page. Budget: $50k/mo.' },
      { agent: 'bang', msg: 'Astutik, can we handle the technical requirements?' },
      { agent: 'astutik', msg: 'API integration needed. ETA: 3 days. Feasible.' },
      { agent: 'gesit', msg: 'Sending proposal draft to Bang for review.' },
      { agent: 'pedas', msg: 'Timeline aggressive. Recommend buffer day for testing.' }
    ]
  },
  {
    name: 'System Alert',
    messages: [
      { agent: 'astutik', msg: 'Server CPU at 85%. Monitoring script triggered.' },
      { agent: 'handal', msg: 'No correlation with external events. Internal spike.' },
      { agent: 'bang', msg: 'Astutik, root cause?' },
      { agent: 'astutik', msg: 'Batch job stuck in loop. Killing process now.' },
      { agent: 'cermat', msg: 'Cost impact: ~$12 in compute. Minimal.' }
    ]
  }
];

async function sendMessage(agent, message) {
  const payload = JSON.stringify({ agent, message });
  
  return new Promise((resolve, reject) => {
    const curl = spawn('curl', [
      '-s', '-X', 'POST',
      'http://127.0.0.1:18790/api/chat/post',
      '-H', 'Content-Type: application/json',
      '-d', payload
    ]);
    
    curl.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`curl exited ${code}`));
    });
  });
}

async function runScenario(scenario) {
  console.log(`\n🎬 Scenario: ${scenario.name}`);
  console.log('─'.repeat(50));
  
  for (const { agent, msg } of scenario.messages) {
    await sendMessage(agent, msg);
    console.log(`  [${agent.toUpperCase()}] ${msg.slice(0, 50)}...`);
    await sleep(1500);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  🤖 Agent Simulator - Demo Mode');
  console.log('═══════════════════════════════════════════════════');
  console.log('  Simulating agent conversations...');
  console.log('  Open http://localhost:18790 to watch live\n');
  
  // Check if server is running
  try {
    const res = await fetch('http://127.0.0.1:18790/health');
    if (!res.ok) throw new Error('Server not ready');
  } catch {
    console.log('⚠️  Server not running. Start with: npm start');
    process.exit(1);
  }
  
  // Run scenarios
  for (const scenario of SCENARIOS) {
    await runScenario(scenario);
    await sleep(3000);
  }
  
  console.log('\n✅ Demo complete!');
  console.log('   Press Ctrl+C to stop server');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
