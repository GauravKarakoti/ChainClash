use linera_sdk::{
    linera_base_types::{Amount, Owner},
    ContractAbi, ServiceAbi,
};
use serde::{Deserialize, Serialize};
use linera_sdk::abi::Abi;  

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
    pub fn is_active(&self) -> bool {
        self.status == AuctionStatus::Active && self.get_time_remaining() > 0
    }

    pub fn get_time_remaining(&self) -> u64 {
        // Note: System time access in contract logic is deterministic in Linera
        let current_time = linera_sdk::sys::current_system_time().micros();
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