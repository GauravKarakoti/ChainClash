use linera_sdk::{
    base::Owner,
    abi::Abi,
};
use linera_sdk::linera_base_types::Amount;
use linera_sdk::abi::ContractAbi;
use linera_sdk::abi::ServiceAbi;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::SimpleObject)]
pub struct Auction {
    pub auction_id: u64,
    pub item: String,
    pub start_time: u64,
    pub duration: u64,
    pub highest_bid: Amount,
    pub highest_bidder: Owner,
    pub active_bidders: Vec<Owner>,
    pub status: AuctionStatus,
}

impl Auction {
    // Pass current_time explicitly to avoid dependency on system APIs here
    pub fn is_active(&self, current_time: u64) -> bool {
        self.status == AuctionStatus::Active && self.get_time_remaining(current_time) > 0
    }

    pub fn get_time_remaining(&self, current_time: u64) -> u64 {
        if current_time >= self.start_time + self.duration {
            0
        } else {
            self.start_time + self.duration - current_time
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Copy, async_graphql::Enum)]
pub enum AuctionStatus {
    Active,
    Ended,
    Cancelled,
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Operation {
    CreateAuction { item: String, duration: u64 },
    PlaceBid { auction_id: u64, amount: Amount },
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Message {
    BidPlaced { auction_id: u64, bidder: Owner, amount: Amount },
}

#[derive(Debug, Deserialize, Serialize)]
pub enum Response {
    AuctionCreated { auction_id: u64 },
    BidPlaced { auction_id: u64, amount: Amount },
    AuctionEnded { auction_id: u64, winner: Owner },
}

#[derive(Debug, thiserror::Error)]
pub enum AuctionError {
    #[error("Auction not found")]
    AuctionNotFound,
    #[error("Auction ended")]
    AuctionEnded,
    #[error("Bid too low")]
    BidTooLow,
    #[error("Insufficient balance")]
    InsufficientBalance,
    #[error("Unauthorized")]
    Unauthorized,
    #[error("Storage error")]
    StorageError(#[from] linera_sdk::views::ViewError),
    #[error("JSON error")]
    JsonError(#[from] serde_json::Error),
}

pub struct AuctionAbi;

impl ContractAbi for AuctionAbi {
    type Operation = Operation;
    type Response = Response;
}

impl ServiceAbi for AuctionAbi {
    type Query = async_graphql::Request;
    type QueryResponse = async_graphql::Response;
    type Parameters = ();
}

impl Abi for AuctionAbi {
    type ContractAbi = AuctionAbi;
    type ServiceAbi = AuctionAbi;
}