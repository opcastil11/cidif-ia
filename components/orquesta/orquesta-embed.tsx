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
  // Token is public (embed token) - safe to include in client bundle
  const token = process.env.NEXT_PUBLIC_ORQUESTA_EMBED_TOKEN || 'oek_z5AV0KV1PvXJWnB3oPuHzNpLkelGaNOPH69ZdW_0bdA';

  return (
    <OrquestaEmbedComponent
      token={token}
      position="bottom-right"
    />
  );
}
