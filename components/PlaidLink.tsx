'use client';

/**
 * LEDGER - PLAID LINK COMPONENT
 * 
 * Client-side Plaid Link integration for bank account connection
 */

import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';

interface PlaidLinkProps {
  onSuccess: () => void;
}

export default function PlaidLink({ onSuccess }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch link token on mount
  useEffect(() => {
    async function fetchLinkToken() {
      try {
        const response = await fetch('/api/plaid/create-link-token', {
          method: 'POST',
        });
        const data = await response.json();
        setLinkToken(data.link_token);
      } catch (error) {
        console.error('Error fetching link token:', error);
      }
    }
    fetchLinkToken();
  }, []);

  // Handle successful bank connection
  const handleOnSuccess = useCallback(async (publicToken: string) => {
    setLoading(true);
    try {
      // Exchange public token for access token (server-side)
      const response = await fetch('/api/plaid/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        console.error('Token exchange failed:', error);
        alert('Failed to connect bank account. Please try again.');
      }
    } catch (error) {
      console.error('Error exchanging token:', error);
      alert('Failed to connect bank account. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  const config = {
    token: linkToken,
    onSuccess: handleOnSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  if (!linkToken) {
    return (
      <button
        disabled
        className="px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading}
      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {loading ? 'Connecting...' : 'Connect Bank Account'}
    </button>
  );
}
