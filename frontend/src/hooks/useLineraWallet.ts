import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useMemo } from 'react';

export interface LineraWallet {
  address: string | undefined;
  chainId: string | undefined;
  isConnected: boolean;
  query: (query: any, variables?: any) => Promise<any>;
  mutate: (params: { mutation: any; variables?: any }) => Promise<any>;
  subscribe: (subscription: any, variables: any, callback: any) => Promise<any>;
}

export const useLineraWallet = () => {
  const { primaryWallet, handleLogOut } = useDynamicContext();

  const wallet = useMemo<LineraWallet | null>(() => {
    if (!primaryWallet) return null;

    return {
      address: primaryWallet.address,
      // Cast to string to ensure compatibility with the interface if strictly typed as an Enum/Union
      chainId: primaryWallet.chain as string, 
      isConnected: true,
      
      // Map Dynamic's connector to the interface your app expects
      query: async (query, variables) => {
        // Cast connector to 'any' to bypass the missing type definition for getWalletClient
        const connector = primaryWallet.connector as any;
        
        // Access the underlying Linera provider
        const provider = await connector.getWalletClient();
        
        // Implement the specific query call supported by the Linera SDK via Dynamic
        return provider.request({ 
          method: 'linera_query', 
          params: [query, variables] 
        });
      },

      mutate: async ({ mutation, variables }) => {
        const connector = primaryWallet.connector as any;
        const provider = await connector.getWalletClient();
        return provider.request({ 
          method: 'linera_mutate', 
          params: [mutation, variables] 
        });
      },
      
      subscribe: async (subscription, variables, callback) => {
         const connector = primaryWallet.connector as any;
         const provider = await connector.getWalletClient();
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