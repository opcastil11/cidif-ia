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
  // Token hardcoded since it's a public embed token (NEXT_PUBLIC_*)
  const token = process.env.NEXT_PUBLIC_ORQUESTA_EMBED_TOKEN || 'oek_4c4ZGiRfDyAwOmOiLYoIKzpHGqrMDy44m7iDyesa8EM';

  return (
    <OrquestaEmbedComponent
      token={token}
      position="bottom-right"
    />
  );
}
