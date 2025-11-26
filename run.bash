#!/usr/bin/env bash

set -eu
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# --- CONFIGURATION ---
# Use the official Linera Testnet (Conway) Faucet
FAUCET_URL="https://faucet.testnet-conway.linera.net"

echo "Using Linera Testnet: $FAUCET_URL"

# 1. Initialize Wallet (Client Only)
# This creates a lightweight client wallet instead of running a full local network.
echo "Initializing Wallet..."
linera wallet init --faucet "$FAUCET_URL"

echo "Requesting Chain from Faucet..."
linera wallet request-chain --faucet "$FAUCET_URL"

# 2. Capture the Client Chain ID
# This is the unique chain ID for this specific container instance
CHAIN_ID=$(linera wallet show | grep -oE "[0-9a-fA-F]{64}" | head -n 1)
echo "Container Chain ID: $CHAIN_ID"

# 3. Verify Application ID (Provided via ENV)
if [ -z "${APP_ID:-}" ]; then
    echo "ERROR: APP_ID environment variable is missing!"
    echo "Please deploy the contract first using 'scripts/deploy.sh' locally,"
    echo "then pass the resulting Application ID to this container."
    exit 1
fi
echo "Using App ID: $APP_ID"

# 4. Run Linera Service (Client Node)
# Connects to the public testnet validators.
echo "Starting Linera Service on http://localhost:8081..."
# We run in the background. The service allows the frontend to query the Testnet.
linera service --port 8081 &

# 5. Run Frontend
echo "Setting up Frontend..."
cd frontend

# Construct the endpoint for the Testnet Application
APP_URL="http://localhost:8081/chains/$CHAIN_ID/applications/$APP_ID"

if [ -f "src/utils/graphql.ts.template" ]; then
    echo "Configuring frontend with App URL: $APP_URL"
    cp src/utils/graphql.ts.template src/utils/graphql.ts
    
    # Update HTTP and WebSocket endpoints
    sed -i "s|http://localhost:8081/graphql|$APP_URL|g" src/utils/graphql.ts
    sed -i "s|ws://localhost:8081/graphql|ws://localhost:8081/chains/$CHAIN_ID/applications/$APP_ID|g" src/utils/graphql.ts
fi

npm install

echo "Starting Vite Server..."
# --host 0.0.0.0 is required to expose the server outside the Docker container
npm run dev -- --host 0.0.0.0