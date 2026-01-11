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
  // IMPORTANT: Using hardcoded token because Vercel env var may have old revoked token
  // To use env var again, update NEXT_PUBLIC_ORQUESTA_EMBED_TOKEN in Vercel dashboard first
  const token = 'oek_4c4ZGiRfDyAwOmOiLYoIKzpHGqrMDy44m7iDyesa8EM';

  return (
    <OrquestaEmbedComponent
      token={token}
      position="bottom-right"
    />
  );
}
