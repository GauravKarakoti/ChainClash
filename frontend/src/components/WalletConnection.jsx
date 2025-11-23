import React from 'react';
import { useLineraWallet } from '../hooks/useLineraWallet';
import './WalletConnection.css';

const WalletConnection = () => {
  const { wallet, loading, error, connectWallet, disconnectWallet } = useLineraWallet();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  if (loading) {
    return (
      <div className="wallet-connection loading">
        <div className="spinner"></div>
        <span>Connecting to Linera...</span>
      </div>
    );
  }

  if (wallet) {
    return (
      <div className="wallet-connection connected">
        <div className="wallet-info">
          <div className="wallet-address">
            {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
          </div>
          <div className="chain-id">Chain: {wallet.chainId}</div>
        </div>
        <button className="disconnect-btn" onClick={handleDisconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connection disconnected">
      {error && <div className="error-message">{error}</div>}
      <button className="connect-btn" onClick={handleConnect}>
        Connect Linera Wallet
      </button>
    </div>
  );
};

export default WalletConnection;