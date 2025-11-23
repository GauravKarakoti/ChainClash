use linera_sdk::{
    base::{Amount, Owner, ChainId},
    graphql::GraphQLMutationRoot,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
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
        let current_time = linera_sdk::base::system_api::current_system_time();
        if current_time >= self.start_time + self.duration {
            0
        } else {
            self.start_time + self.duration - current_time
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AuctionStatus {
    Active,
    Ended,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Operation {
    CreateAuction { item: String, duration: u64 },
    PlaceBid { auction_id: u64, amount: Amount },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Message {
    BidPlaced { auction_id: u64, bidder: Owner, amount: Amount },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Response {
    AuctionCreated { auction_id: u64 },
    BidPlaced { auction_id: u64, amount: Amount },
    AuctionEnded { auction_id: u64, winner: Owner },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuctionError {
    AuctionNotFound,
    AuctionEnded,
    BidTooLow,
    InsufficientBalance,
    Unauthorized,
    StorageError,
}

impl From<linera_sdk::views::ViewError> for AuctionError {
    fn from(_: linera_sdk::views::ViewError) -> Self {
        AuctionError::StorageError
    }
}

// ABIs for Linera protocol
pub struct AuctionAbi;

impl linera_sdk::abi::Abi for AuctionAbi {
    type Operation = Operation;
    type Message = Message;
    type Response = Response;
}