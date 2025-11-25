#!/usr/bin/env bash

set -eu
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 1. Start Local Network
echo "Starting Linera Local Net..."
eval "$(linera net helper)"
linera_spawn linera net up --with-faucet

# 2. Initialize Wallet
export LINERA_FAUCET_URL=http://localhost:8080
linera wallet init --faucet="$LINERA_FAUCET_URL"
linera wallet request-chain --faucet="$LINERA_FAUCET_URL"

# --- NEW: Capture the Chain ID ---
CHAIN_ID=$(linera wallet show | grep -oE "[0-9a-fA-F]{64}" | head -n 1)
echo "Using Chain ID: $CHAIN_ID"

# 3. Publish and Create Application
echo "Publishing Application..."
APP_ID=$(linera publish-and-create target/wasm32-unknown-unknown/release/contract.wasm target/wasm32-unknown-unknown/release/service.wasm)
echo "ChainClash App ID: $APP_ID"

# 4. Run Linera Service (Backend)
# We use port 8081 to avoid conflict with the faucet on 8080
echo "Starting Linera Service on http://localhost:8081..."
# Note: Linera service usually binds to 127.0.0.1 by default. 
# If you are running this inside Docker and accessing from the host, 
# you might need to ensure it listens on 0.0.0.0.
# However, your 404 error suggests it IS reachable, just the path was wrong.
linera service --port 8081 &

# 5. Run Frontend
echo "Setting up Frontend..."
cd frontend

# --- NEW: Update graphql.ts with the FULL Application URL ---
# Construct the correct endpoint for your specific application
APP_URL="http://localhost:8081/chains/$CHAIN_ID/applications/$APP_ID"

if [ -f "src/utils/graphql.ts.template" ]; then
    cp src/utils/graphql.ts.template src/utils/graphql.ts
    
    sed -i "s|http://localhost:8081/graphql|$APP_URL|g" src/utils/graphql.ts
    sed -i "s|ws://localhost:8081/graphql|ws://localhost:8081/chains/$CHAIN_ID/applications/$APP_ID|g" src/utils/graphql.ts
fi

npm install

echo "Starting Vite Server..."
# --host 0.0.0.0 is required to expose the server outside the Docker container
npm run dev -- --host 0.0.0.0