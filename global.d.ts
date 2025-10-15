// global.d.ts
export {};

declare global {
  interface Window {
    electronAPI?: {
      quitApp: () => void;
    };
  }
}
