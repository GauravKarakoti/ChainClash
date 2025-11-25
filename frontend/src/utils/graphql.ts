import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

// Linera GraphQL endpoint for Testnet Conway
const LINERA_GRAPHQL_HTTP = 'http://localhost:8081/chains/6e08deb116327b13f99c05ad1dee97448b7582558675ae08c584ec703fe27cba/applications/d858f7be3a8e89f131ad43ed2543025725c892723fbf8716a09901ae17c2847e';
const LINERA_GRAPHQL_WS = 'http://localhost:8081/chains/6e08deb116327b13f99c05ad1dee97448b7582558675ae08c584ec703fe27cba/applications/d858f7be3a8e89f131ad43ed2543025725c892723fbf8716a09901ae17c2847e';

const httpLink = createHttpLink({
  uri: LINERA_GRAPHQL_HTTP,
});

// WebSocket link for real-time subscriptions
const wsLink = new GraphQLWsLink(createClient({
  url: LINERA_GRAPHQL_WS,
  connectionParams: () => ({
    // Add authentication tokens if needed
  }),
}));

// Split links - WebSocket for subscriptions, HTTP for queries/mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink,
);

// Apollo Client instance
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
    query: {
      fetchPolicy: 'network-only',
    },
  },
});

// GraphQL queries
export const QUERIES = {
  GET_AUCTION: `
    query GetAuction($auctionId: ID!) {
      auction(auctionId: $auctionId) {
        auctionId
        item
        startTime
        duration
        highestBid
        highestBidder
        activeBidders
        status
        timeRemaining
        isActive
      }
    }
  `,
  
  GET_ACTIVE_AUCTIONS: `
    query GetActiveAuctions {
      activeAuctions {
        auctionId
        item
        highestBid
        highestBidder
        timeRemaining
        isActive
        activeBidders
      }
    }
  `,
};

export const MUTATIONS = {
  PLACE_BID: `
    mutation PlaceBid($auctionId: ID!, $amount: BigInt!) {
      placeBid(auctionId: $auctionId, amount: $amount) {
        auctionId
        amount
      }
    }
  `,
  
  CREATE_AUCTION: `
    mutation CreateAuction($item: String!, $duration: BigInt!) {
      createAuction(item: $item, duration: $duration) {
        auctionId
        item
      }
    }
  `,
};

export const SUBSCRIPTIONS = {
  AUCTION_UPDATED: `
    subscription AuctionUpdated($auctionId: ID!) {
      auctionUpdated(auctionId: $auctionId) {
        auctionId
        bidder
        amount
      }
    }
  `,
};