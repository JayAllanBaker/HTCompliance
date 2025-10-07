#!/bin/bash
# Verbose Docker logging helper script
# This script shows detailed logs from the BizGov Docker containers

echo "========================================="
echo "BizGov Verbose Docker Logs"
echo "========================================="
echo ""

# Check if containers are running
if ! docker ps | grep -q bizgov; then
    echo "⚠️  No BizGov containers are running!"
    echo ""
    echo "Start containers with:"
    echo "  docker-compose up -d"
    echo ""
    exit 1
fi

echo "Showing live logs from all containers..."
echo "Press Ctrl+C to stop"
echo ""

# Follow logs from both containers with timestamps
docker-compose logs -f --timestamps --tail=100
