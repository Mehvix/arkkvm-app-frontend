import type { LogLevel, configureLogger } from '@/utils/logger';

declare global {
  interface Window {
    __arkkvm_pc__?: RTCPeerConnection;
    __arkkvm_rpc__?: { send: (call: unknown) => unknown };
    __arkkvm_state__?: Record<string, unknown>;
    __arkkvm_debug__?: {
      configureLogger: typeof configureLogger;
      LogLevel: typeof LogLevel;
    };
  }
}
