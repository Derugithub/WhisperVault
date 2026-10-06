import { getLocales } from 'expo-localization';
import { getNotesRepository } from '../db/client';
import { RECOGNITION_LANGUAGE_KEY, resolveRecognitionLanguage } from '../domain/languages';

export async function readRecognitionLanguage(): Promise<string> {
  const repository = await getNotesRepository();
  const stored = await repository.getSetting(RECOGNITION_LANGUAGE_KEY);
  const device = getLocales()[0]?.languageTag ?? null;
  return resolveRecognitionLanguage(device, stored);
}

export async function writeRecognitionLanguage(tag: string): Promise<void> {
  const repository = await getNotesRepository();
  await repository.setSetting(RECOGNITION_LANGUAGE_KEY, tag);
}
