import React from 'react';
import { useLineraClient } from '../hooks/useLineraClient';
import './AuctionList.css';

const AuctionList = ({ onSelectAuction }) => {
  const { useActiveAuctions } = useLineraClient();
  const { activeAuctions, loading, error } = useActiveAuctions();

  if (loading) {
    return (
      <div className="auction-list loading">
        <div className="spinner"></div>
        <span>Loading auctions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auction-list error">
        <div className="error-icon">⚠️</div>
        <span>Failed to load auctions: {error.message}</span>
      </div>
    );
  }

  return (
    <div className="auction-list">
      <h2>Active Auctions ({activeAuctions.length})</h2>
      <div className="auctions-grid">
        {activeAuctions.map((auction) => (
          <div
            key={auction.auctionId}
            className="auction-card"
            onClick={() => onSelectAuction(auction.auctionId)}
          >
            <div className="auction-item">{auction.item}</div>
            <div className="auction-bid">
              <span className="bid-label">Current Bid:</span>
              <span className="bid-amount">{auction.highestBid} LIN</span>
            </div>
            <div className="auction-time">
              <span className="time-label">Time Left:</span>
              <span className="time-remaining">{auction.timeRemaining}s</span>
            </div>
            <div className="auction-bidders">
              <span className="bidders-count">
                {auction.activeBidders?.length || 0} bidders
              </span>
            </div>
            <div className={`auction-status ${auction.isActive ? 'active' : 'ended'}`}>
              {auction.isActive ? 'LIVE' : 'ENDED'}
            </div>
          </div>
        ))}
      </div>
      {activeAuctions.length === 0 && (
        <div className="no-auctions">
          <div className="no-auctions-icon">🏷️</div>
          <h3>No Active Auctions</h3>
          <p>Be the first to create an auction!</p>
        </div>
      )}
    </div>
  );
};

export default AuctionList;