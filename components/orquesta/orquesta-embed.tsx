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
const EMBED_TOKEN = 'oek_z5AV0KV1PvXJWnB3oPuHzNpLkelGaNOPH69ZdW_0bdA';

// Use our own API as proxy to avoid CORS issues with orquesta.live
const API_URL = typeof window !== 'undefined'
  ? `${window.location.origin}/api/orquesta`
  : '';

export function OrquestaEmbedWrapper() {
  return (
    <OrquestaEmbedComponent
      token={EMBED_TOKEN}
      position="bottom-right"
      theme="auto"
      apiUrl={API_URL}
    />
  );
}
