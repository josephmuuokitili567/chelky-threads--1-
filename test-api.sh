#!/bin/bash
# Quick server health check script

echo "Testing Chelky Threads API..."
echo ""

# Health check
echo "1. Health Check (GET /health)"
curl -s http://localhost:5000/health | jq . 2>/dev/null || echo "Server not running"
echo ""

# Test product endpoint
echo "2. Products Endpoint (GET /api/products)"
curl -s http://localhost:5000/api/products | jq . 2>/dev/null || echo "Server not running"
echo ""

echo "Test complete!"
