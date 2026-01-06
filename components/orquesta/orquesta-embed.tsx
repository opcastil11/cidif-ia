'use client';

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

export function OrquestaEmbedWrapper({ token }: OrquestaEmbedWrapperProps) {
  // Get token from props or environment
  const embedToken = token || process.env.NEXT_PUBLIC_ORQUESTA_EMBED_TOKEN;

  // Only render if token is available
  if (!embedToken) {
    return null;
  }

  return (
    <OrquestaEmbedComponent
      token={embedToken}
      position="bottom-right"
      theme="auto"
      captureConsole={true}
      captureNetwork={true}
      onReady={() => console.log('[Orquesta] Embed widget ready')}
      onError={(error: Error) => console.error('[Orquesta] Error:', error)}
    />
  );
}
