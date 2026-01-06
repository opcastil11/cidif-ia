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

// Hardcoded token - no need to rely on Vercel env vars
const EMBED_TOKEN = 'oek_vSvcRnxhvUesF5XHJ3m5xZeDbuJgYvsQZZwCC6xWQPQ';

export function OrquestaEmbedWrapper() {
  return (
    <OrquestaEmbedComponent
      token={EMBED_TOKEN}
      position="bottom-right"
      theme="auto"
    />
  );
}
