#!/bin/bash
# Clawd Office Chat API - Test Script
# Usage: ./test-office-chat-api.sh

API_URL="http://127.0.0.1:18790"
echo "🧪 Testing Clawd Office Chat API"
echo "=================================="

# Check if server is running
echo ""
echo "1️⃣  Checking server health..."
HEALTH=$(curl -s "${API_URL}/health" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Server is running"
    echo "   Response: $HEALTH"
else
    echo "❌ Server not responding at ${API_URL}"
    echo "   Start server with: ./start-office-chat-api.sh"
    exit 1
fi

echo ""
echo "2️⃣  Testing valid agent (handal)..."
curl -s -X POST "${API_URL}/api/office-chat/post" \
    -H "Content-Type: application/json" \
    -d '{"agent": "handal", "message": "Test message from handal via API"}' | jq .

echo ""
echo "3️⃣  Testing valid agent (cermat)..."
curl -s -X POST "${API_URL}/api/office-chat/post" \
    -H "Content-Type: application/json" \
    -d '{"agent": "cermat", "message": "Cermat monitoring aktif"}' | jq .

echo ""
echo "4️⃣  Testing valid agent (astutik)..."
curl -s -X POST "${API_URL}/api/office-chat/post" \
    -H "Content-Type: application/json" \
    -d '{"agent": "astutik", "message": "API endpoint ready!"}' | jq .

echo ""
echo "5️⃣  Testing invalid agent (should fail)..."
curl -s -X POST "${API_URL}/api/office-chat/post" \
    -H "Content-Type: application/json" \
    -d '{"agent": "invalid", "message": "This should fail"}' | jq .

echo ""
echo "6️⃣  Testing missing message (should fail)..."
curl -s -X POST "${API_URL}/api/office-chat/post" \
    -H "Content-Type: application/json" \
    -d '{"agent": "handal"}' | jq .

echo ""
echo "7️⃣  Testing empty message (should fail)..."
curl -s -X POST "${API_URL}/api/office-chat/post" \
    -H "Content-Type: application/json" \
    -d '{"agent": "pedas", "message": ""}' | jq .

echo ""
echo "8️⃣  Testing remaining agents..."
for agent in gesit pedas bang; do
    echo "   Testing ${agent}..."
    curl -s -X POST "${API_URL}/api/office-chat/post" \
        -H "Content-Type: application/json" \
        -d "{\"agent\": \"${agent}\", \"message\": \"Hello from ${agent}!\"}" | jq -c .
done

echo ""
echo "✅ All tests completed!"
echo ""
echo "📁 Check chat file:"
echo "   tail -5 /Users/danyarkham/clawd/memory/clawd-office-chat.md"
echo ""
echo "📜 Check server logs:"
echo "   tail -20 /Users/danyarkham/clawd/logs/office-chat-api.log"
