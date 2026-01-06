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
  const token = process.env.NEXT_PUBLIC_ORQUESTA_EMBED_TOKEN || 'oek_eczF-Xp-K3JqGamV1aV9BEdzQDpr8Mie0cOiBK1PF_A';

  return (
    <OrquestaEmbedComponent
      token={token}
      position="bottom-right"
    />
  );
}
