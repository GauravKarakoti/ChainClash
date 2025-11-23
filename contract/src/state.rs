use linera_sdk::views::{View, MapView, RootView};
use serde::{Deserialize, Serialize};

#[derive(RootView, Serialize, Deserialize)]
pub struct AuctionState {
    pub auctions: MapView<u64, super::auction::Auction>,
}