use linera_sdk::views::{linera_views, MapView, RootView, ViewStorageContext};

#[derive(RootView, async_graphql::SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct AuctionState {
    pub auctions: MapView<u64, super::auction::Auction>,
}