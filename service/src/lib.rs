use linera_sdk::{
    base::{WithServiceAbi, Amount, Owner},
    graphql::GraphQLMutationRoot,
    Service, ViewState,
};
use async_trait::async_trait;
use std::sync::Arc;
use auction::{Auction, Response, Operation};

pub mod auction;

linera_sdk::service!(AuctionService);

impl WithServiceAbi for AuctionService {
    type Abi = auction::AuctionAbi;
}

#[async_trait]
impl Service for AuctionService {
    type Error = auction::AuctionError;
    type Storage = ViewState<super::contract::state::AuctionState>;
    type Parameters = ();

    async fn new(
        state: Self::Storage,
        _chain_id: linera_sdk::base::ChainId,
        _argument: (),
    ) -> Result<Self, Self::Error> {
        Ok(AuctionService { state })
    }

    async fn handle_query(
        &self,
        request: Self::Query,
    ) -> Result<Self::QueryResponse, Self::Error> {
        match request {
            auction::Query::GetAuction { auction_id } => {
                self.get_auction(auction_id).await
            }
            auction::Query::GetActiveAuctions => {
                self.get_active_auctions().await
            }
            auction::Query::GetUserBids { user } => {
                self.get_user_bids(user).await
            }
        }
    }
}

impl AuctionService {
    async fn get_auction(
        &self,
        auction_id: u64,
    ) -> Result<auction::QueryResponse, auction::AuctionError> {
        let auction = self.state.auctions.get(&auction_id).await?
            .ok_or(auction::AuctionError::AuctionNotFound)?;
        
        Ok(auction::QueryResponse::Auction(auction))
    }

    async fn get_active_auctions(
        &self,
    ) -> Result<auction::QueryResponse, auction::AuctionError> {
        let mut active_auctions = Vec::new();
        
        // Iterate through all auctions to find active ones
        // Note: In production, you'd want an index for this
        for index in 0..1000 { // Practical limit for demo
            if let Some(auction) = self.state.auctions.get(&index).await? {
                if auction.is_active() {
                    active_auctions.push(auction);
                }
            }
        }
        
        Ok(auction::QueryResponse::ActiveAuctions(active_auctions))
    }

    async fn get_user_bids(
        &self,
        user: Owner,
    ) -> Result<auction::QueryResponse, auction::AuctionError> {
        let mut user_bids = Vec::new();
        
        for index in 0..1000 {
            if let Some(auction) = self.state.auctions.get(&index).await? {
                if auction.active_bidders.contains(&user) {
                    user_bids.push(auction);
                }
            }
        }
        
        Ok(auction::QueryResponse::UserBids(user_bids))
    }
}