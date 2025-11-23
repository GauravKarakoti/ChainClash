#!/usr/bin/env bash

set -eu

# 1. Start Local Network
echo "Starting Linera Local Net..."
eval "$(linera net helper)"
linera_spawn linera net up --with-faucet

# 2. Initialize Wallet
export LINERA_FAUCET_URL=http://localhost:8080
linera wallet init --faucet="$LINERA_FAUCET_URL"
linera wallet request-chain --faucet="$LINERA_FAUCET_URL"

# 3. Build Backend (ChainClash)
echo "Building ChainClash Contracts..."
cargo build --release --target wasm32-unknown-unknown

# 4. Publish and Create Application
echo "Publishing Application..."
APP_ID=$(linera publish-and-create target/wasm32-unknown-unknown/release/contract.wasm target/wasm32-unknown-unknown/release/service.wasm)
echo "ChainClash App ID: $APP_ID"

# 5. Run Linera Service (Backend)
# We use port 8081 to avoid conflict with the faucet on 8080
echo "Starting Linera Service on http://localhost:8081..."
linera service --port 8081 &

# 6. Run Frontend
echo "Setting up Frontend..."
cd frontend

# Update graphql.js to point to the service on port 8081 instead of 8080
if [ -f "src/utils/graphql.js" ]; then
    sed -i 's/localhost:8080/localhost:8081/g' src/utils/graphql.js
fi

npm install

echo "Starting Vite Server..."
# --host 0.0.0.0 is required to expose the server outside the Docker container
npm run dev -- --host 0.0.0.0