import { useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './utils/graphql';
import WalletConnection from './components/WalletConnection';
import AuctionList from './components/AuctionList';
import AuctionDetail from './components/AuctionDetail';
import './App.css';

function App() {
  const [selectedAuction, setSelectedAuction] = useState<string | null>(null);

  const handleSelectAuction = (auctionId: string) => {
    setSelectedAuction(auctionId);
  };

  const handleBackToList = () => {
    setSelectedAuction(null);
  };

  return (
    <ApolloProvider client={apolloClient}>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">ChainClash</h1>
            <p className="app-subtitle">Real-time bidding on Linera</p>
          </div>
          <WalletConnection />
        </header>

        <main className="app-main">
          <div className="app-content">
            {selectedAuction ? (
              <AuctionDetail 
                auctionId={selectedAuction} 
                onBack={handleBackToList}
              />
            ) : (
              <AuctionList onSelectAuction={handleSelectAuction} />
            )}
          </div>
        </main>
      </div>
    </ApolloProvider>
  );
}

export default App;