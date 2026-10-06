export function localDatabaseMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : '';
  if (/vfs|opfs|sqlite|wasm|modification|database/i.test(raw)) {
    return 'The notes on this device could not be opened. Reload and try again.';
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'The notes on this device could not be opened. Reload and try again.';
}
