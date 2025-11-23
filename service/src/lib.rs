#![cfg_attr(target_arch = "wasm32", no_main)]

use async_graphql::{EmptyMutation, EmptySubscription, Schema, Object};
use linera_sdk::{
    linera_base_types::Amount, // Corrected import
    views::View,
    Service, ServiceRuntime,
};
use linera_sdk::abi::WithServiceAbi;
use std::sync::Arc;

#[path = "../../contract/src/state.rs"]
mod state;
#[path = "../../contract/src/auction.rs"]
mod auction;

use self::state::AuctionState;

pub struct AuctionService {
    state: Arc<AuctionState>,
    runtime: ServiceRuntime<Self>, // Store runtime to access system time
}

linera_sdk::service!(AuctionService);

impl WithServiceAbi for AuctionService {
    type Abi = auction::AuctionAbi;
}

impl Service for AuctionService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = AuctionState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        AuctionService {
            state: Arc::new(state),
            runtime,
        }
    }

    async fn handle_query(&self, request: async_graphql::Request) -> async_graphql::Response {
        // Fetch current time safely from the runtime
        let current_time = self.runtime.system_time().micros();

        let schema = Schema::build(
            QueryRoot { 
                state: self.state.clone(),
                current_time 
            },
            EmptyMutation,
            EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}

// --- GraphQL Schema Implementation ---

struct QueryRoot {
    state: Arc<AuctionState>,
    current_time: u64,
}

#[Object]
impl QueryRoot {
    async fn active_auctions(&self) -> Vec<AuctionView> {
        let mut active = Vec::new();
        // active_auctions query requires filtering
        let ids = self.state.auctions.indices().await.unwrap_or_default();
        for id in ids {
            if let Some(auction) = self.state.auctions.get(&id).await.unwrap_or(None) {
                // Filter for active status and time remaining
                if auction.status == auction::AuctionStatus::Active 
                   && auction.get_time_remaining(self.current_time) > 0 {
                    active.push(AuctionView { 
                        auction, 
                        current_time: self.current_time 
                    });
                }
            }
        }
        active
    }

    async fn auction(&self, auction_id: u64) -> Option<AuctionView> {
        let auction = self.state.auctions.get(&auction_id).await.unwrap_or(None)?;
        Some(AuctionView { 
            auction, 
            current_time: self.current_time 
        })
    }
}

// Wrapper struct to expose fields + computed logic to GraphQL
struct AuctionView {
    auction: auction::Auction,
    current_time: u64,
}

#[Object]
impl AuctionView {
    // Delegate standard fields to the inner auction struct
    async fn auction_id(&self) -> u64 { self.auction.auction_id }
    async fn item(&self) -> &String { &self.auction.item }
    async fn start_time(&self) -> u64 { self.auction.start_time }
    async fn duration(&self) -> u64 { self.auction.duration }
    async fn highest_bid(&self) -> Amount { self.auction.highest_bid }
    
    async fn highest_bidder(&self) -> Option<linera_sdk::linera_base_types::AccountOwner> { 
        self.auction.highest_bidder 
    }
    
    async fn active_bidders(&self) -> &Vec<linera_sdk::linera_base_types::AccountOwner> { 
        &self.auction.active_bidders 
    }
    
    async fn status(&self) -> auction::AuctionStatus { self.auction.status }

    // Computed fields (required by frontend) using the stored current_time
    async fn time_remaining(&self) -> u64 {
        self.auction.get_time_remaining(self.current_time)
    }

    async fn is_active(&self) -> bool {
        self.auction.is_active(self.current_time)
    }
}