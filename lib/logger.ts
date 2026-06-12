export function createLogger(namespace: string) {
  const prefix = `[${namespace}]`;

  return {
    info: (msg: string, ...args: unknown[]) => {
      console.log(`${prefix} ${msg}`, ...args);
    },
    warn: (msg: string, ...args: unknown[]) => {
      console.warn(`${prefix} WARN: ${msg}`, ...args);
    },
    error: (msg: string, ...args: unknown[]) => {
      console.error(`${prefix} ERROR: ${msg}`, ...args);
    },
  };
}
