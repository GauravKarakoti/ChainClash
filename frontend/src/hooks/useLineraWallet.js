import { useState, useEffect } from 'react';

export const useLineraWallet = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = async () => {
    setLoading(true);
    setError(null);

    try {
      // For Testnet Conway, we'll use the Linera dev wallet
      // In production, this would integrate with Dynamic wallet
      if (typeof window.linera === 'undefined') {
        throw new Error('Linera wallet not found. Please install the Linera extension.');
      }

      const accounts = await window.linera.request({ method: 'linera_requestAccounts' });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const lineraWallet = {
        address: accounts[0],
        chainId: await window.linera.request({ method: 'linera_chainId' }),
        isConnected: true,
        
        query: async (query, variables) => {
          return await window.linera.request({
            method: 'linera_query',
            params: [query, variables],
          });
        },

        mutate: async ({ mutation, variables }) => {
          return await window.linera.request({
            method: 'linera_mutate',
            params: [mutation, variables],
          });
        },

        subscribe: async (subscription, variables, callback) => {
          return await window.linera.request({
            method: 'linera_subscribe',
            params: [subscription, variables, callback],
          });
        },
      };

      setWallet(lineraWallet);
      return lineraWallet;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    setError(null);
  };

  // Auto-connect on component mount
  useEffect(() => {
    if (typeof window.linera !== 'undefined' && window.linera.isConnected) {
      connectWallet().catch(console.error);
    }
  }, []);

  return {
    wallet,
    loading,
    error,
    connectWallet,
    disconnectWallet,
  };
};