import React, { useState, useEffect, type FormEvent } from 'react';
import { useLineraClient } from '../hooks/useLineraClient';
import { useLineraWallet } from '../hooks/useLineraWallet';
import './AuctionDetail.css';

interface AuctionDetailProps {
  auctionId: string;
  onBack: () => void;
}

const AuctionDetail: React.FC<AuctionDetailProps> = ({ auctionId, onBack }) => {
  const { useAuction, placeBid } = useLineraClient();
  const { wallet } = useLineraWallet();
  const { auction, loading, error, subscribeToBids } = useAuction(auctionId);
  
  const [bidAmount, setBidAmount] = useState<string>('');
  const [placingBid, setPlacingBid] = useState<boolean>(false);
  const [bidError, setBidError] = useState<string>('');

  useEffect(() => {
    if (auctionId && subscribeToBids) {
      subscribeToBids();
    }
  }, [auctionId, subscribeToBids]);

  const handleBid = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!wallet) {
      setBidError('Please connect your wallet first');
      return;
    }

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      setBidError('Please enter a valid bid amount');
      return;
    }

    if (auction && parseFloat(bidAmount) <= parseFloat(auction.highestBid)) {
      setBidError(`Bid must be higher than current bid: ${auction.highestBid} LIN`);
      return;
    }

    setPlacingBid(true);
    setBidError('');

    try {
      await placeBid(auctionId, bidAmount);
      setBidAmount('');
      // Bid success will be reflected via subscription
    } catch (err: any) {
      setBidError(err.message || 'Failed to place bid');
    } finally {
      setPlacingBid(false);
    }
  };

  const formatAddress = (address?: string) => {
    if (!address) return 'None';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="auction-detail loading">
        <button className="back-button" onClick={onBack}>← Back to Auctions</button>
        <div className="spinner"></div>
        <span>Loading auction...</span>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="auction-detail error">
        <button className="back-button" onClick={onBack}>← Back to Auctions</button>
        <div className="error-icon">⚠️</div>
        <span>Failed to load auction: {error?.message || 'Auction not found'}</span>
      </div>
    );
  }

  return (
    <div className="auction-detail">
      <button className="back-button" onClick={onBack}>← Back to Auctions</button>
      
      <div className="auction-header">
        <h1>{auction.item}</h1>
        <div className={`auction-status ${auction.isActive ? 'active' : 'ended'}`}>
          {auction.isActive ? 'LIVE' : 'ENDED'}
        </div>
      </div>

      <div className="auction-info">
        <div className="info-row">
          <span className="label">Auction ID:</span>
          <span className="value">#{auction.auctionId}</span>
        </div>
        <div className="info-row">
          <span className="label">Time Remaining:</span>
          <span className="value time-remaining">{auction.timeRemaining} seconds</span>
        </div>
        <div className="info-row">
          <span className="label">Highest Bid:</span>
          <span className="value bid-amount">{auction.highestBid} LIN</span>
        </div>
        <div className="info-row">
          <span className="label">Current Leader:</span>
          <span className="value bidder">{formatAddress(auction.highestBidder)}</span>
        </div>
        <div className="info-row">
          <span className="label">Total Bidders:</span>
          <span className="value bidders">{auction.activeBidders?.length || 0}</span>
        </div>
      </div>

      {auction.isActive && (
        <div className="bid-section">
          <h3>Place Your Bid</h3>
          <form onSubmit={handleBid} className="bid-form">
            <div className="bid-input-group">
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Enter bid higher than ${auction.highestBid} LIN`}
                step="0.1"
                min={parseFloat(auction.highestBid) + 0.1}
                className="bid-input"
              />
              <span className="currency">LIN</span>
            </div>
            
            {bidError && <div className="bid-error">{bidError}</div>}
            
            <button 
              type="submit" 
              className="bid-button"
              disabled={placingBid || !wallet}
            >
              {placingBid ? (
                <>
                  <div className="button-spinner"></div>
                  Placing Bid...
                </>
              ) : (
                'Place Bid'
              )}
            </button>
            
            {!wallet && (
              <div className="wallet-warning">
                Connect your wallet to place a bid
              </div>
            )}
          </form>
        </div>
      )}

      {!auction.isActive && (
        <div className="auction-ended">
          <h3>🎉 Auction Ended</h3>
          <p>The winner is {formatAddress(auction.highestBidder)} with a bid of {auction.highestBid} LIN</p>
        </div>
      )}

      {/* Real-time bid updates */}
      <div className="real-time-indicator">
        <div className="pulse"></div>
        <span>Live Updates</span>
      </div>
    </div>
  );
};

export default AuctionDetail;