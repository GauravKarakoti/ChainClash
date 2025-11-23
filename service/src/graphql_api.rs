use async_graphql::{Object, SimpleObject, Subscription, Enum};
use linera_sdk::base::{Amount, Owner};
use serde::{Deserialize, Serialize};

#[derive(SimpleObject, Clone, Serialize, Deserialize)]
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

#[derive(Enum, Copy, Clone, Eq, PartialEq, Serialize, Deserialize)]
pub enum AuctionStatus {
    Active,
    Ended,
    Cancelled,
}

#[derive(SimpleObject)]
pub struct AuctionCreated {
    pub auction_id: u64,
    pub item: String,
}

#[derive(SimpleObject)]
pub struct BidPlaced {
    pub auction_id: u64,
    pub bidder: Owner,
    pub amount: Amount,
}

#[Object]
impl Auction {
    async fn time_remaining(&self) -> u64 {
        let current_time = linera_sdk::base::system_api::current_system_time();
        if current_time >= self.start_time + self.duration {
            0
        } else {
            self.start_time + self.duration - current_time
        }
    }

    async fn is_active(&self) -> bool {
        self.status == AuctionStatus::Active && self.time_remaining().await > 0
    }
}

#[Subscription]
impl Subscription {
    async fn auction_updated(&self, auction_id: u64) -> async_graphql::Result<BidPlaced> {
        // This would be connected to Linera's subscription mechanism
        // For now, we return a placeholder
        Ok(BidPlaced {
            auction_id,
            bidder: Owner::from([0; 32]),
            amount: Amount::from(0),
        })
    }
}