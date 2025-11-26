# ChainClash
> Real-time, on-chain bidding battles. Fastest finger wins.

**Linera Build-a-thon Wave 3 Submission** **Category:** Games

## Project Description
ChainClash is a hyper-casual dApp built on the **Linera protocol** that showcases the power of real-time, low-latency blockchain interactions. Submitted under the **Games** category for the Linera Build-a-thon, it allows users to engage in fast-paced, short-duration auctions where bids are settled with sub-second finality. 

This project is fully deployed and tested for compatibility with **Linera's Testnet Conway**, meeting the Wave 3 objective of live testnet deployment using client-side integration.

## Features
- **Instant Bidding:** Place bids and see updates in real-time thanks to Linera's sub-second block finality.
- **Microchain Architecture:** Utilizes user-owned microchains for funds and temporary chains for individual auctions.
- **Seamless Wallet Onboarding:** Easy connection using **Dynamic wallet integration** (supports MetaMask, Phantom, etc.), aligning with the Wave 3 focus on web client library usage.
- **Real-time UI:** The frontend updates instantly using GraphQL subscriptions to the Linera client.

## Technology Stack
- **Blockchain:** Linera (Testnet Conway)
- **Smart Contract:** Rust, compiled to Wasm
- **Linera SDK:** Version 0.15+
- **Frontend:** React/TypeScript, GraphQL
- **Wallet:** Dynamic SDK (Web Client Integration)

## Installation & Setup

### Prerequisites
- Ensure you have the Linera CLI installed and configured for Testnet Conway.
- A compatible web wallet (e.g., MetaMask).

### Steps
1.  **Get Testnet Tokens:**
    ```bash
    linera wallet init --faucet [https://faucet.testnet-conway.linera.net](https://faucet.testnet-conway.linera.net)
    linera wallet request-chain --faucet [https://faucet.testnet-conway.linera.net](https://faucet.testnet-conway.linera.net)
    ```
2.  **Build the Application:**
    ```bash
    cd chainclash
    cargo build --release --target wasm32-unknown-unknown
    ```
3.  **Publish and Create the Application:**
    ```bash
    linera publish-and-create \
      target/wasm32-unknown-unknown/release/chainclash_{contract,service}.wasm
    ```
4.  **Run the Linera Service:**
    ```bash
    linera service --port 8080
    ```
5.  **Open the Frontend:** Navigate to `http://localhost:8080` in your browser. The GraphiQL interface will be available. Use the provided link from your application's `link` field to interact with the UI.

## How to Use
1.  Connect your wallet via the Dynamic prompt.
2.  Fund your personal microchain with testnet tokens from the faucet.
3.  Join an active auction from the lobby.
4.  Place your bids and watch the clock tick down in real-time!

## Linera SDK & Protocol Features Used
- **Microchains:** Personal user chains for assets and temporary chains for auction instances.
- **Cross-Chain Messaging:** For propagating bids and auction state between participants.
- **GraphQL API:** For frontend interaction and real-time updates via subscriptions.
- **Dynamic Wallet Integration:** Implements the required Testnet Conway web client standards.

## Team & Contact
- **Members:** [Gaurav Karakoti]
- **X (Twitter) Handles:** [GauravKara_Koti](https://x.com/GauravKara_Koti)
- **Telegram Handles:** [GauravKarakoti](https://t.me/GauravKarakoti)

## Changelog
Reflecting the iterative improvements emphasized in the Build-a-thon:
- **Wave 3 (Current):** Full deployment to **Testnet Conway**, integration of Dynamic wallet for seamless user onboarding, and polished UI for the Games category submission.
- **Wave 4:** Basic auction contract deployment on a single chain.
- **Wave 5:** Implemented cross-chain bidding and real-time UI updates.