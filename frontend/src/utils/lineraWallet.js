// Mock Linera wallet for development
// In production, this would be replaced with the actual Linera wallet extension

export class MockLineraWallet {
  constructor() {
    this.address = '0x' + Array.from({length: 32}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    this.chainId = 'testnet-conway-1';
    this.isConnected = true;
  }

  async request({ method, params = [] }) {
    console.log('Wallet request:', method, params);
    
    switch (method) {
      case 'linera_requestAccounts':
        return [this.address];
        
      case 'linera_chainId':
        return this.chainId;
        
      case 'linera_query':
        // Simulate GraphQL query
        return await this.mockQuery(...params);
        
      case 'linera_mutate':
        // Simulate GraphQL mutation
        return await this.mockMutate(...params);
        
      case 'linera_subscribe':
        // Simulate GraphQL subscription
        return await this.mockSubscribe(...params);
        
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  async mockQuery(query, variables) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock response based on query
    if (query.includes('GetActiveAuctions')) {
      return {
        data: {
          activeAuctions: [
            {
              auctionId: '1',
              item: 'Rare Digital Art #001',
              highestBid: '10.5',
              highestBidder: '0x' + Array.from({length: 32}, () => 
                Math.floor(Math.random() * 16).toString(16)
              ).join(''),
              timeRemaining: '45',
              isActive: true,
              activeBidders: Array.from({length: 3}, () => 
                '0x' + Array.from({length: 32}, () => 
                  Math.floor(Math.random() * 16).toString(16)
                ).join('')
              )
            },
            {
              auctionId: '2',
              item: 'Golden Key NFT',
              highestBid: '25.0',
              highestBidder: '0x' + Array.from({length: 32}, () => 
                Math.floor(Math.random() * 16).toString(16)
              ).join(''),
              timeRemaining: '120',
              isActive: true,
              activeBidders: Array.from({length: 5}, () => 
                '0x' + Array.from({length: 32}, () => 
                  Math.floor(Math.random() * 16).toString(16)
                ).join('')
              )
            }
          ]
        }
      };
    }
    
    if (query.includes('GetAuction')) {
      return {
        data: {
          auction: {
            auctionId: variables.auctionId,
            item: 'Rare Digital Art #001',
            startTime: Date.now() - 30000,
            duration: 90000,
            highestBid: '10.5',
            highestBidder: '0x' + Array.from({length: 32}, () => 
              Math.floor(Math.random() * 16).toString(16)
            ).join(''),
            activeBidders: Array.from({length: 3}, () => 
              '0x' + Array.from({length: 32}, () => 
                Math.floor(Math.random() * 16).toString(16)
              ).join('')
            ),
            status: 'Active',
            timeRemaining: '45',
            isActive: true
          }
        }
      };
    }
    
    throw new Error(`Mock query not implemented for: ${query}`);
  }

  async mockMutate(mutation, variables) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (mutation.includes('PlaceBid')) {
      return {
        data: {
          placeBid: {
            auctionId: variables.auctionId,
            amount: variables.amount
          }
        }
      };
    }
    
    throw new Error(`Mock mutation not implemented for: ${mutation}`);
  }

  async mockSubscribe(subscription, variables, callback) {
    // Simulate real-time updates
    const interval = setInterval(() => {
      callback({
        data: {
          auctionUpdated: {
            auctionId: variables.auctionId,
            bidder: '0x' + Array.from({length: 32}, () => 
              Math.floor(Math.random() * 16).toString(16)
            ).join(''),
            amount: (Math.random() * 5 + 10).toFixed(1)
          }
        }
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }
}

// Initialize mock wallet for development
if (typeof window !== 'undefined' && !window.linera) {
  window.linera = new MockLineraWallet();
  window.linera.isConnected = false;
}