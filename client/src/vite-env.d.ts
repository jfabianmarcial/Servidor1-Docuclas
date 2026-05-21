/// <reference types="vite/client" />

declare module '*.css';
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SERVER_1: string;
    readonly VITE_SERVER_2: string;
    readonly VITE_SERVER_3: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}   