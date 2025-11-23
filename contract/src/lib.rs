use linera_sdk::{
    base::{Amount, ApplicationId, Owner, ChainId, WithContractAbi},
    contract::system_api,
    graphql::GraphQLMutationRoot,
    Contract, ViewState,
};
use async_trait::async_trait;
use auction::{Auction, AuctionError};
use state::AuctionState;

pub mod auction;
pub mod state;

linera_sdk::contract!(AuctionContract);

impl WithContractAbi for AuctionContract {
    type Abi = auction::AuctionAbi;
}

#[async_trait]
impl Contract for AuctionContract {
    type Error = AuctionError;
    type Storage = ViewState<AuctionState>;

    async fn new(state: Self::Storage, _chain_id: ChainId) -> Result<Self, Self::Error> {
        Ok(AuctionContract { state })
    }

    async fn initialize(
        &mut self,
        _chain_id: ChainId,
        _argument: Self::InitializationArgument,
    ) -> Result<(), Self::Error> {
        Ok(())
    }

    async fn execute_operation(
        &mut self,
        operation: Self::Operation,
    ) -> Result<Self::Response, Self::Error> {
        match operation {
            auction::Operation::CreateAuction { item, duration } => {
                self.create_auction(item, duration).await
            }
            auction::Operation::PlaceBid { auction_id, amount } => {
                self.place_bid(auction_id, amount).await
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) -> Result<(), Self::Error> {
        match message {
            auction::Message::BidPlaced { auction_id, bidder, amount } => {
                self.process_bid_message(auction_id, bidder, amount).await
            }
        }
    }
}

impl AuctionContract {
    async fn create_auction(
        &mut self,
        item: String,
        duration: u64,
    ) -> Result<auction::Response, AuctionError> {
        let auction_id = self.state.auctions.count().await? + 1;
        let start_time = system_api::current_system_time();
        
        let auction = Auction {
            auction_id,
            item,
            start_time,
            duration,
            highest_bid: Amount::from(0),
            highest_bidder: Owner::from([0; 32]),
            active_bidders: Vec::new(),
            status: auction::AuctionStatus::Active,
        };

        self.state.auctions.insert(&auction_id, auction).await?;
        
        Ok(auction::Response::AuctionCreated { auction_id })
    }

    async fn place_bid(
        &mut self,
        auction_id: u64,
        amount: Amount,
    ) -> Result<auction::Response, AuctionError> {
        let mut auction = self.state.auctions.get(&auction_id).await?
            .ok_or(AuctionError::AuctionNotFound)?;

        let bidder = system_api::current_application_id().owner;
        
        // Validate auction is active
        if !auction.is_active() {
            return Err(AuctionError::AuctionEnded);
        }

        // Validate bid amount
        if amount <= auction.highest_bid {
            return Err(AuctionError::BidTooLow);
        }

        // Update auction state
        auction.highest_bid = amount;
        auction.highest_bidder = bidder;
        
        if !auction.active_bidders.contains(&bidder) {
            auction.active_bidders.push(bidder);
        }

        // Save updated auction
        self.state.auctions.insert(&auction_id, auction).await?;

        // Broadcast bid to other chains via cross-chain message
        let message = auction::Message::BidPlaced {
            auction_id,
            bidder,
            amount,
        };

        // Use Linera's push_message for real-time propagation
        system_api::push_message(message);

        Ok(auction::Response::BidPlaced { auction_id, amount })
    }

    async fn process_bid_message(
        &mut self,
        auction_id: u64,
        bidder: Owner,
        amount: Amount,
    ) -> Result<(), AuctionError> {
        if let Some(mut auction) = self.state.auctions.get(&auction_id).await? {
            // Update local state with incoming bid
            if amount > auction.highest_bid && auction.is_active() {
                auction.highest_bid = amount;
                auction.highest_bidder = bidder;
                self.state.auctions.insert(&auction_id, auction).await?;
            }
        }
        Ok(())
    }
}