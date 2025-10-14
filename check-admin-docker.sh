#!/bin/bash
echo "Checking if admin user exists in Docker database..."
docker exec -i $(docker ps -qf "name=bizgov-postgres") psql -U postgres -d htdb -c "SELECT username, role, email FROM users WHERE username='admin';"
