import React from 'react';
import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import './WalletConnection.css';

const WalletConnection: React.FC = () => {
  // DynamicWidget handles loading, error, and connected states internally
  return (
    <div className="wallet-connection">
      <DynamicWidget />
    </div>
  );
};

export default WalletConnection;