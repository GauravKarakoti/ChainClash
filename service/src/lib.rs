#![cfg_attr(target_arch = "wasm32", no_main)]

use async_graphql::{EmptyMutation, EmptySubscription, Schema};
use linera_sdk::{
    linera_base_types::WithServiceAbi,
    views::{View, RootView},
    Service, ServiceRuntime,
};
use std::sync::Arc;

// You need to ensure `state.rs` and `auction.rs` are accessible here too.
// Often done by declaring them as modules if files exist in service/src too.
#[path = "../../contract/src/state.rs"]
mod state;
#[path = "../../contract/src/auction.rs"]
mod auction;

use self::state::AuctionState;

pub struct AuctionService {
    state: Arc<AuctionState>,
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
        }
    }

    async fn handle_query(&self, request: async_graphql::Request) -> async_graphql::Response {
        let schema = Schema::build(
            self.state.clone(),
            EmptyMutation,
            EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}