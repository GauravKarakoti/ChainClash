#!/bin/bash

echo "Building ChainClash for Linera Testnet Conway..."

# Build contract and service
cargo build --release --target wasm32-unknown-unknown

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Publishing to Linera Testnet Conway..."

# Deploy using Linera CLI
linera project publish \
    --chain-id $CHAIN_ID \
    --provider $PROVIDER_URL

echo "Deployment complete!"
echo "Application ID: $APPLICATION_ID"