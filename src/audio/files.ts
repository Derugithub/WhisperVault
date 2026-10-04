import { Directory, File, Paths } from 'expo-file-system';

export function ensureRecordingsDirectory(): string {
  const directory = new Directory(Paths.document, 'recordings');
  directory.create({ intermediates: true, idempotent: true });
  return directory.uri;
}

export function deleteLocalFile(uri: string | null | undefined): void {
  if (!uri) {
    return;
  }
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // The database row is removed separately. A missing file should not block that.
  }
}
