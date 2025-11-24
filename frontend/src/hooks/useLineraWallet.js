import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useMemo } from 'react';

export const useLineraWallet = () => {
  const { primaryWallet, handleLogOut } = useDynamicContext();

  const wallet = useMemo(() => {
    if (!primaryWallet) return null;

    return {
      address: primaryWallet.address,
      chainId: primaryWallet.chain, // or specific chain ID if available
      isConnected: true,
      
      // Map Dynamic's connector to the interface your app expects
      query: async (query, variables) => {
        // Access the underlying Linera provider if needed
        const provider = await primaryWallet.connector.getWalletClient();
        // Implement the specific query call supported by the Linera SDK via Dynamic
        return provider.request({ 
          method: 'linera_query', 
          params: [query, variables] 
        });
      },

      mutate: async ({ mutation, variables }) => {
        const provider = await primaryWallet.connector.getWalletClient();
        return provider.request({ 
          method: 'linera_mutate', 
          params: [mutation, variables] 
        });
      },
      
      subscribe: async (subscription, variables, callback) => {
         const provider = await primaryWallet.connector.getWalletClient();
         // Subscription logic depends on the specific Linera Provider API
         return provider.request({
            method: 'linera_subscribe',
            params: [subscription, variables, callback]
         });
      }
    };
  }, [primaryWallet]);

  return {
    wallet,
    loading: false, // Dynamic handles loading state internally mostly
    error: null,
    connectWallet: () => {}, // DynamicWidget handles this
    disconnectWallet: handleLogOut,
  };
};