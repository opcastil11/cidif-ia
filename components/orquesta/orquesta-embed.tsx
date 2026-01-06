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

export function OrquestaEmbedWrapper() {
  const token = process.env.NEXT_PUBLIC_ORQUESTA_EMBED_TOKEN;

  // Don't render if no token configured
  if (!token) {
    return null;
  }

  return (
    <OrquestaEmbedComponent
      token={token}
      position="bottom-right"
      theme="auto"
    />
  );
}
