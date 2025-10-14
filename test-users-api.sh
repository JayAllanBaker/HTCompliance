#!/bin/bash
echo "Testing /api/users endpoint in Docker..."
echo ""
echo "========================================="
echo "Making authenticated request to /api/users:"
echo "========================================="

# Get the container name
CONTAINER=$(docker ps --filter "name=bizgov-app" --format "{{.Names}}" | head -1)

if [ -z "$CONTAINER" ]; then
  echo "Error: Could not find bizgov-app container"
  exit 1
fi

# Test the endpoint from inside the container
docker exec -i "$CONTAINER" sh -c '
wget -q -O- --header="Cookie: connect.sid=test" http://localhost:5000/api/users 2>&1 || echo "Request failed"
'

echo ""
echo "========================================="
echo "If you see 401/403, the session cookie is not set."
echo "The frontend needs to be authenticated to call this endpoint."
echo "========================================="
