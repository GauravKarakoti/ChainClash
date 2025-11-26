#!/bin/bash

# Ensure we are in the project root (one level up from this script)
cd "$(dirname "$0")/.."

echo "Building ChainClash for Linera Testnet Conway..."

# 1. Clean previous build artifacts
echo "Cleaning target directory..."
rm -rf target

# 2. Configure Environment Variables for MVP Wasm
# Fixes "opcode 252" and "embed-bitcode" errors
export CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUSTFLAGS="-C target-cpu=mvp -C target-feature=-bulk-memory -C target-feature=-sign-ext -C target-feature=-mutable-globals -C opt-level=z -C lto=fat -C embed-bitcode=yes"

echo "Compiling with flags: $CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_RUSTFLAGS"

# 3. Build the project
cargo build --release --target wasm32-unknown-unknown

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Publishing to Linera Testnet Conway..."

# 4. Publish with Retry Logic (Fix for Timestamp Future Error)
# We try 5 times with a 10s delay to handle clock synchronization mismatches
MAX_RETRIES=5
COUNT=0
SUCCESS=0

while [ $COUNT -lt $MAX_RETRIES ]; do
    echo "Attempting deployment ($((COUNT+1))/$MAX_RETRIES)..."
    
    # Try to publish and capture the output
    OUTPUT=$(linera publish-and-create \
        target/wasm32-unknown-unknown/release/contract.wasm \
        target/wasm32-unknown-unknown/release/service.wasm 2>&1)
    
    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        # Success! Extract the ID from the output (it might be mixed with logs)
        # We assume the last line of a successful run contains the ID or we parse it
        # Since 'linera publish-and-create' outputs the ID to stdout, 
        # but we captured both stdout and stderr, we echo the raw output to user
        echo "$OUTPUT"
        APPLICATION_ID=$(echo "$OUTPUT" | grep -oE "[0-9a-fA-F]{64}" | tail -n 1)
        SUCCESS=1
        break
    else
        echo "Deployment failed with error:"
        echo "$OUTPUT"
        
        # Check specifically for timestamp error
        if echo "$OUTPUT" | grep -q "timestamp is in the future"; then
            echo "Clock sync error detected. Waiting 10 seconds for time to catch up..."
            sleep 10
        else
            # If it's another error (like logic), fail immediately
            echo "Encountered a non-timestamp error. Retrying just in case..."
            sleep 5
        fi
    fi

    COUNT=$((COUNT+1))
done

if [ $SUCCESS -eq 1 ]; then
    echo "Deployment complete!"
    echo "Application ID: $APPLICATION_ID"
else
    echo "Deployment failed after $MAX_RETRIES attempts."
    exit 1
fi