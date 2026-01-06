'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'orquesta-embed/styles.css';

// Dynamically import with no SSR since OrquestaEmbed uses browser APIs
const OrquestaEmbedComponent = dynamic(
  () => import('orquesta-embed').then((mod) => mod.OrquestaEmbed),
  {
    ssr: false,
    loading: () => null
  }
);

interface OrquestaEmbedWrapperProps {
  token?: string;
}

export function OrquestaEmbedWrapper({ token: propToken }: OrquestaEmbedWrapperProps) {
  const [token, setToken] = useState<string | null>(propToken || null);
  const [isLoading, setIsLoading] = useState(!propToken);

  useEffect(() => {
    // If token is provided via props, use it directly
    if (propToken) {
      setToken(propToken);
      setIsLoading(false);
      return;
    }

    // Check for env var first (for development)
    const envToken = process.env.NEXT_PUBLIC_ORQUESTA_EMBED_TOKEN;
    if (envToken) {
      setToken(envToken);
      setIsLoading(false);
      return;
    }

    // Fetch token from Orquesta backend via our API
    async function fetchEmbedToken() {
      try {
        const response = await fetch('/api/orquesta/embed-token');
        if (response.ok) {
          const data = await response.json();
          if (data.token) {
            setToken(data.token);
          }
        } else {
          console.warn('[Orquesta] Failed to fetch embed token:', response.status);
        }
      } catch (error) {
        console.error('[Orquesta] Error fetching embed token:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmbedToken();
  }, [propToken]);

  // Don't render while loading or if no token
  if (isLoading || !token) {
    return null;
  }

  return (
    <OrquestaEmbedComponent
      token={token}
      position="bottom-right"
      theme="auto"
      captureConsole={true}
      captureNetwork={true}
      onReady={() => console.log('[Orquesta] Embed widget ready')}
      onError={(error: Error) => console.error('[Orquesta] Error:', error)}
    />
  );
}
