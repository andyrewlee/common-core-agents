// Minimal ambient declarations for @inkeep/agents-core
// These cover the specific APIs used in this repo. Adjust as needed if usage grows.

declare module '@inkeep/agents-core' {
  // Logging
  export function getLogger(name: string): {
    info: (meta?: any, message?: string, ...args: any[]) => void;
    error: (meta?: any, message?: string, ...args: any[]) => void;
    warn: (meta?: any, message?: string, ...args: any[]) => void;
    debug: (meta?: any, message?: string, ...args: any[]) => void;
  };

  // Credential stores
  export class InMemoryCredentialStore {
    constructor(name: string);
  }

  export function createNangoCredentialStore(
    name: string,
    config: { apiUrl: string; secretKey: string }
  ): any;

  export function createKeyChainStore(name: string): any;

  // Database helpers (used by scripts/setup.js)
  export function createDatabaseClient(config: { url: string }): any;

  export function createProject(dbClient: any): (input: any) => Promise<any>;

  export function getProject(dbClient: any): (input: any) => Promise<any>;
}

