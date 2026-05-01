/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DATABASE_URL: string;
  readonly WHATSAPP_NUMBER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
