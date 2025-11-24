import { useQuery, gql } from '@apollo/client';
import { useLineraWallet } from './useLineraWallet';

export interface Auction {
  auctionId: string;
  item: string;
  startTime: string;
  duration: string;
  highestBid: string;
  highestBidder: string;
  activeBidders: string[];
  status: string;
  timeRemaining: number;
  isActive: boolean;
}

export interface ActiveAuction {
  auctionId: string;
  item: string;
  highestBid: string;
  highestBidder: string;
  timeRemaining: number;
  isActive: boolean;
  activeBidders?: string[];
}

export const useLineraClient = () => {
  const { wallet } = useLineraWallet();

  const GET_AUCTION = gql`
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
  `;

  const GET_ACTIVE_AUCTIONS = gql`
    query GetActiveAuctions {
      activeAuctions {
        auctionId
        item
        highestBid
        highestBidder
        timeRemaining
        isActive
      }
    }
  `;

  const AUCTION_UPDATED = gql`
    subscription AuctionUpdated($auctionId: ID!) {
      auctionUpdated(auctionId: $auctionId) {
        auctionId
        bidder
        amount
      }
    }
  `;

  const PLACE_BID = gql`
    mutation PlaceBid($auctionId: ID!, $amount: BigInt!) {
      placeBid(auctionId: $auctionId, amount: $amount) {
        auctionId
        amount
      }
    }
  `;

  const useAuction = (auctionId: string | null) => {
    const { data, loading, error, subscribeToMore } = useQuery(GET_AUCTION, {
      variables: { auctionId },
      skip: !auctionId,
    });

    // Real-time subscription for bid updates
    const subscribeToBids = () => {
      subscribeToMore({
        document: AUCTION_UPDATED,
        variables: { auctionId },
        updateQuery: (prev, { subscriptionData }) => {
          if (!subscriptionData.data) return prev;
          const newBid = subscriptionData.data.auctionUpdated;
          
          return {
            ...prev,
            auction: {
              ...prev.auction,
              highestBid: newBid.amount,
              highestBidder: newBid.bidder,
            }
          };
        },
      });
    };

    return {
      auction: data?.auction as Auction | undefined,
      loading,
      error,
      subscribeToBids,
    };
  };

  const useActiveAuctions = () => {
    const { data, loading, error } = useQuery(GET_ACTIVE_AUCTIONS, {
      pollInterval: 2000, // Poll every 2 seconds for updates
    });

    return {
      activeAuctions: (data?.activeAuctions || []) as ActiveAuction[],
      loading,
      error,
    };
  };

  const placeBid = async (auctionId: string, amount: string) => {
    if (!wallet) throw new Error('Wallet not connected');

    try {
      const result = await wallet.mutate({
        mutation: PLACE_BID,
        variables: { auctionId, amount },
      });

      return result.data.placeBid;
    } catch (error) {
      console.error('Failed to place bid:', error);
      throw error;
    }
  };

  return {
    useAuction,
    useActiveAuctions,
    placeBid,
  };
};