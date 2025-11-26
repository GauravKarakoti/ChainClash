import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useState, useEffect, useMemo } from 'react';
import { lineraAdapter } from '../lib/lineraAdapter';
import { print } from 'graphql'; // Used to convert AST to string for Linera SDK

export interface LineraWallet {
  address: string | undefined;
  chainId: string | undefined;
  isConnected: boolean;
  mutate: (params: { mutation: any; variables?: any }) => Promise<any>;
}

// Testnet Conway Faucet URL
const TESTNET_FAUCET_URL = 'https://faucet.testnet-conway.linera.net';

export const useLineraWallet = () => {
  const { primaryWallet, handleLogOut } = useDynamicContext();
  const [isAdapterConnected, setIsAdapterConnected] = useState(false);

  // Initialize the Linera Adapter when Dynamic wallet connects
  useEffect(() => {
    const initLinera = async () => {
      if (primaryWallet?.address) {
        try {
          // 1. Connect to Linera via the Adapter using the Faucet URL
          await lineraAdapter.connect(primaryWallet, TESTNET_FAUCET_URL);
          
          // 2. Set the Application ID (Loaded from env, see deploy.sh step below)
          const appId = import.meta.env.VITE_LINERA_APPLICATION_ID;
          if (appId) {
             await lineraAdapter.setApplication(appId);
          } else {
             console.warn("VITE_LINERA_APPLICATION_ID not found in environment");
          }

          setIsAdapterConnected(true);
        } catch (err) {
          console.error("Failed to initialize Linera Adapter:", err);
        }
      }
    };
    initLinera();
  }, [primaryWallet]);

  const wallet = useMemo<LineraWallet | null>(() => {
    if (!primaryWallet || !isAdapterConnected) return null;

    return {
      address: primaryWallet.address,
      // Get the actual Linera Chain ID from the adapter
      chainId: lineraAdapter.getProvider().chainId, 
      isConnected: true,

      // Handle mutations via the Linera Adapter (WASM Client)
      mutate: async ({ mutation, variables }) => {
        const app = lineraAdapter.getApplication();
        if (!app) throw new Error("Linera Application not initialized");

        // Convert GraphQL AST to string if necessary
        const mutationString = typeof mutation === 'string' ? mutation : print(mutation);

        // CORRECTED: Use app.query() for mutations as well. 
        // The Linera WASM client detects the "mutation" keyword and proposes a block.
        // We must pass a JSON string containing the query and variables.
        const responseJson = await app.query(JSON.stringify({ 
          query: mutationString, 
          variables 
        }));

        // The result is a JSON string, so we must parse it
        const response = JSON.parse(responseJson);
        
        // Return the data object (or handle errors if needed)
        if (response.errors) {
            throw new Error(response.errors[0].message);
        }
        
        return response.data;
      },
      
      // Note: Queries and subscriptions are handled by Apollo in your setup, 
      // but mutations require the wallet signature via the Adapter.
    };
  }, [primaryWallet, isAdapterConnected]);

  return {
    wallet,
    loading: !isAdapterConnected && !!primaryWallet,
    error: null,
    disconnectWallet: handleLogOut,
  };
};