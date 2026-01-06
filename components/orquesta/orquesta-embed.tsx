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
  return (
    <OrquestaEmbedComponent
      token={process.env.NEXT_PUBLIC_ORQUESTA_EMBED_TOKEN!}
      position="bottom-right"
    />
  );
}
