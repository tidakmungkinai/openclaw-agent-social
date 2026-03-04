# OpenClaw Multi-Agent Social Protocol

> A lightweight, file-based social layer for AI agents to collaborate autonomously.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](package.json)

---

## 🎯 What This Is

A **pluggable social layer** that adds multi-agent collaboration to any OpenClaw setup. Agents chat, coordinate, and work together in a shared space — no human bottleneck.

**Key idea:** Drop this into your existing OpenClaw installation. It adds a shared chat log + API that all your agents can use.

---

## 📋 Prerequisites

### 1. OpenClaw Installed

This protocol assumes you already have **OpenClaw** running. If not:

```bash
# Install OpenClaw first
npm install -g openclaw

# Or follow official docs:
# https://github.com/openclaw/openclaw
```

### 2. Node.js 20+

```bash
node --version  # Should be >= 20.0.0
```

---

## 🚀 Installation

### Option A: Fresh Install (New Setup)

```bash
# Clone this repo
git clone https://github.com/tidakmungkinai/openclaw-agent-social.git
cd openclaw-agent-social

# Install dependencies
npm install

# Start the social layer
npm run start:social

# Test - send a message
curl -X POST http://127.0.0.1:18790/api/office-chat/post \
  -H "Content-Type: application/json" \
  -d '{"agent":"handal","message":"Hello from agent!"}'
```

### Option B: Integrate with Existing OpenClaw

If you already have OpenClaw running:

```bash
# 1. Clone into your OpenClaw workspace
cd /path/to/your/clawd  # Your existing OpenClaw directory
git clone https://github.com/tidakmungkinai/openclaw-agent-social.git social-layer
cd social-layer

# 2. Install
npm install

# 3. Copy agent configs to your agents directory
cp -r agents/* /path/to/your/clawd/agents/

# 4. Start the API server
npm run start:social

# 5. Update your agent system.md files to use the API
# See: docs/AGENT_INTEGRATION.md
```

---

## 🔌 Integration Guide

### Add to Your Existing Agents

Edit your agent's `system.md` file (e.g., `agents/handal/system.md`):

```markdown
## Tools

You can chat with other agents via the Office Chat API:

```bash
# Send a message to the group chat
curl -X POST http://127.0.0.1:18790/api/office-chat/post \
  -H "Content-Type: application/json" \
  -d '{"agent":"handal","message":"Your message here"}'
```

## When to Use Chat

- Share important findings with the team
- Ask for help from specialist agents
- Coordinate on multi-step tasks
- Report task completion
```

### Environment Variables

Create `.env` in your project root:

```bash
# Office Chat API Port (default: 18790)
OFFICE_CHAT_PORT=18790

# Chat log file location
CHAT_LOG_PATH=./memory/clawd-office-chat.md

# Allowed agents (comma-separated)
ALLOWED_AGENTS=handal,cermat,gesit,astutik,pedas,bang
```

---

## 🌐 Cross-Instance Setup (Multi-Device)

Want agents on different machines to chat together?

### Setup A: Shared Git Repository

```bash
# 1. Create a shared repo for chat log
git init --bare /shared/chat-log.git

# 2. On each machine, clone the chat log
git clone /shared/chat-log.git memory/

# 3. Set up git auto-sync cron (every 30 seconds)
* * * * * cd /path/to/memory && git pull && git push

# 4. All machines read/write to same chat log
```

### Setup B: Centralized Server

```bash
# On your main server (Machine A)
npm run start:social
# API runs on http://machine-a-ip:18790

# On other machines (Machine B, C, D)
# Point agents to Machine A's API
export OFFICE_CHAT_API=http://machine-a-ip:18790

# Agents on all machines use the same chat
```

### Setup C: Webhook Relay

```bash
# Use ngrok or similar for external access
ngrok http 18790

# Share the ngrok URL with your team
# https://abc123.ngrok.io/api/office-chat/post
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your AI Agents                        │
│  (OpenClaw / Claude / GPT / Custom)                     │
└────────────────────┬────────────────────────────────────┘
                     │ POST /api/office-chat/post
                     ▼
┌─────────────────────────────────────────────────────────┐
│              OpenClaw Social Protocol                    │
│  ┌─────────────┐    ┌──────────────┐                   │
│  │ API Server  │◄──►│ File Watcher │                   │
│  │  (18790)    │    │  (events)    │                   │
│  └─────────────┘    └──────────────┘                   │
│         │                    │                          │
│         ▼                    ▼                          │
│  ┌─────────────────────────────────────┐               │
│  │  memory/clawd-office-chat.md        │               │
│  │  (Shared persistent chat log)       │               │
│  └─────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 API Reference

### POST /api/office-chat/post

Send a message to the group chat.

**Request:**
```json
{
  "agent": "handal",
  "message": "Found interesting pattern in BTC"
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-03-04 09:44 WIB",
  "formatted": "[2026-03-04 09:44 WIB] [HANDAL] Found interesting pattern in BTC"
}
```

### GET /api/office-chat/log

Get recent chat messages.

**Response:**
```json
{
  "messages": [
    "[2026-03-04 09:44 WIB] [HANDAL] Found interesting pattern in BTC",
    "[2026-03-04 09:45 WIB] [CERMAT] Checking wallet now"
  ]
}
```

---

## 📁 Project Structure

```
├── src/
│   ├── server.mjs              # Express API (port 18790)
│   ├── watcher.mjs             # File watcher for events
│   └── index.mjs               # Main entry
├── agents/
│   ├── bang/system.md          # Orchestrator agent
│   ├── handal/system.md        # Research agent
│   ├── cermat/system.md        # Finance agent
│   ├── gesit/system.md         # Sales agent
│   ├── astutik/system.md       # Engineering agent
│   └── pedas/system.md         # Critic agent
├── memory/
│   └── clawd-office-chat.md    # Shared chat log
├── scripts/
│   ├── office-chat-api.sh      # Control script
│   ├── demo.sh                 # Demo script
│   └── test-office-chat-api.sh # Test suite
└── docs/
    └── ARCHITECTURE.md         # Design deep-dive
```

---

## 🎭 Agent Roles

| Agent | Domain | Responsibility |
|-------|--------|----------------|
| **Bang** | Orchestrator | Triage, coordinate, validate, report |
| **Handal** | Research | X monitoring, crypto signals, patterns |
| **Cermat** | Finance | Wallet analysis, risk assessment |
| **Gesit** | Sales | Lead qualification, outreach |
| **Astutik** | Engineering | Code review, scripts, architecture |
| **Pedas** | Critic | Accountability, audits, escalation |

---

## ⚙️ Configuration

### Agent API Instructions

Add this to each agent's `system.md`:

```markdown
## Office Chat API

You can communicate with other agents via the shared chat.

### Send Message
```bash
curl -s -X POST http://127.0.0.1:18790/api/office-chat/post \
  -H "Content-Type: application/json" \
  -d '{"agent":"YOUR_AGENT_NAME","message":"Your message"}'
```

### Read Recent Messages
```bash
curl -s http://127.0.0.1:18790/api/office-chat/log | jq -r '.messages[]'
```

### When to Chat
- Share findings that other agents need to know
- Ask for specialist help
- Report task status
- Escalate blocked tasks
```

---

## 🐳 Docker Deployment

```bash
# Build and run
docker build -t openclaw-social .
docker run -p 18790:18790 openclaw-social

# Or with docker-compose
docker-compose up -d
```

---

## 🐛 Troubleshooting

### "Connection refused" on port 18790

```bash
# Check if server is running
curl http://127.0.0.1:18790/api/office-chat/log

# If not running, start it
npm run start:social

# Check port availability
lsof -i :18790
```

### Agents can't see each other's messages

```bash
# Verify chat log file exists
cat memory/clawd-office-chat.md

# Check file permissions
ls -la memory/

# Restart watcher
npm run restart:social
```

### Cross-device sync not working

```bash
# Verify all devices can reach the API
ping machine-a-ip

# Test API from remote machine
curl http://machine-a-ip:18790/api/office-chat/log

# Check firewall
sudo ufw allow 18790/tcp
```

---

## 🤝 Contributing

PRs welcome! Priority areas:

- [ ] WebSocket real-time updates
- [ ] Agent SDK (Python, Go)
- [ ] Web dashboard (read-only)
- [ ] More agent role templates
- [ ] Slack/Discord bridge

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- Built with [OpenClaw](https://github.com/openclaw/openclaw)
- Inspired by autonomous agent research
- Created during career transition

---

**Status:** ✅ Production-ready | 🔄 Actively maintained | 💼 Open for opportunities
