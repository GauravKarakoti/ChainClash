#![cfg_attr(target_arch = "wasm32", no_main)]

mod auction;
mod state;

use self::auction::{Auction, AuctionError, Message, Operation, Response};
use self::state::AuctionState;
use linera_sdk::{
    linera_base_types::{AccountOwner, Amount},
    views::{View, RootView},
    Contract, ContractRuntime,
};
use linera_sdk::abi::WithContractAbi;

pub struct AuctionContract {
    state: AuctionState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(AuctionContract);

impl WithContractAbi for AuctionContract {
    type Abi = auction::AuctionAbi;
}

impl Contract for AuctionContract {
    type Message = Message;
    type InstantiationArgument = ();
    type Parameters = ();
    type EventValue = ();
    
    // 1. Load the contract state
    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = AuctionState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        AuctionContract { state, runtime }
    }

    // 2. Initialize (Instantiate)
    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        // No initialization logic needed for now
    }

    // 3. Execute Operation (Transactions)
    async fn execute_operation(
        &mut self,
        operation: Self::Operation,
    ) -> Self::Response {
        match operation {
            Operation::CreateAuction { item, duration } => {
                self.create_auction(item, duration).await.expect("Failed to create auction")
            }
            Operation::PlaceBid { auction_id, amount } => {
                self.place_bid(auction_id, amount).await.expect("Failed to place bid")
            }
        }
    }

    // 4. Execute Message (Cross-chain)
    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::BidPlaced { auction_id, bidder, amount } => {
                let _ = self.process_bid_message(auction_id, bidder, amount).await;
            }
        }
    }

    // 5. Persist State
    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl AuctionContract {
    async fn create_auction(
        &mut self,
        item: String,
        duration: u64,
    ) -> Result<Response, AuctionError> {
        // Cast usize to u64
        let auction_id = (self.state.auctions.count().await? as u64) + 1;
        let start_time = self.runtime.system_time().micros();
        
        let auction = Auction {
            auction_id,
            item,
            start_time,
            duration,
            highest_bid: Amount::ZERO,
            highest_bidder: None, // Logic updated here
            active_bidders: Vec::new(),
            status: auction::AuctionStatus::Active,
        };

        // insert is synchronous
        self.state.auctions.insert(&auction_id, auction)?;
        
        Ok(Response::AuctionCreated { auction_id })
    }

    async fn place_bid(
        &mut self,
        auction_id: u64,
        amount: Amount,
    ) -> Result<Response, AuctionError> {
        let mut auction = self.state.auctions.get(&auction_id).await?
            .ok_or(AuctionError::AuctionNotFound)?;

        let bidder = self.runtime.authenticated_signer().ok_or(AuctionError::Unauthorized)?;
        let current_time = self.runtime.system_time().micros();
        
        // Check if auction is active
        if !auction.is_active(current_time) {
            return Err(AuctionError::AuctionEnded);
        }

        // Validate bid amount
        if amount <= auction.highest_bid {
            return Err(AuctionError::BidTooLow);
        }

        // Update state
        auction.highest_bid = amount;
        auction.highest_bidder = Some(bidder); // Wrapped in Some
        
        if !auction.active_bidders.contains(&bidder) {
            auction.active_bidders.push(bidder);
        }

        // insert is synchronous
        self.state.auctions.insert(&auction_id, auction)?;

        // Broadcast bid
        // In a real app, you would send this to subscriber chains
        
        Ok(Response::BidPlaced { auction_id, amount })
    }

    async fn process_bid_message(
        &mut self,
        auction_id: u64,
        bidder: AccountOwner,
        amount: Amount,
    ) -> Result<(), AuctionError> {
        if let Some(mut auction) = self.state.auctions.get(&auction_id).await? {
            let current_time = self.runtime.system_time().micros();
            if amount > auction.highest_bid && auction.is_active(current_time) {
                auction.highest_bid = amount;
                auction.highest_bidder = Some(bidder); // Wrapped in Some
                self.state.auctions.insert(&auction_id, auction)?;
            }
        }
        Ok(())
    }
}