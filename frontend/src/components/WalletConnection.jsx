import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import './WalletConnection.css';

const WalletConnection = () => {
  // DynamicWidget handles loading, error, and connected states internally
  return (
    <div className="wallet-connection">
      <DynamicWidget />
    </div>
  );
};

export default WalletConnection;