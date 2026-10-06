export type SpeechListener = { remove: () => void };

export type SpeechEvents = {
  result: { results: { transcript?: string }[]; isFinal: boolean };
  volumechange: { value: number };
  audioend: { uri?: string | null };
  error: { error: string; message: string };
  end: null;
};

export type SpeechRecognitionClient = {
  isRecognitionAvailable: () => boolean;
  supportsOnDeviceRecognition: () => boolean;
  supportsRecording: () => boolean;
  start: (options: object) => void;
  stop: () => void;
  abort: () => void;
  addListener: <K extends keyof SpeechEvents>(
    eventName: K,
    listener: (event: SpeechEvents[K]) => void,
  ) => SpeechListener;
  requestMicrophonePermissionsAsync: () => Promise<{ granted: boolean; canAskAgain?: boolean }>;
  getSupportedLocales: (options: object) => Promise<{ installedLocales: string[] }>;
  getSpeechRecognitionServices: () => string[];
  androidTriggerOfflineModelDownload: (options: { locale: string }) => Promise<{ status: string }>;
};

type SpeechModuleLoader = () => unknown;

declare const require: (name: string) => { ExpoSpeechRecognitionModule?: unknown };

function defaultLoadSpeechModule(): unknown {
  // Loaded on demand so Expo Go can render every screen when this native module is absent.
  return require('expo-speech-recognition').ExpoSpeechRecognitionModule;
}

let loader: SpeechModuleLoader = defaultLoadSpeechModule;
let cached: SpeechRecognitionClient | null | undefined;

function asClient(value: unknown): SpeechRecognitionClient | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const candidate = value as Partial<SpeechRecognitionClient>;
  if (
    typeof candidate.start !== 'function' ||
    typeof candidate.stop !== 'function' ||
    typeof candidate.abort !== 'function' ||
    typeof candidate.addListener !== 'function'
  ) {
    return null;
  }
  return candidate as SpeechRecognitionClient;
}

export function getSpeechRecognitionModule(): SpeechRecognitionClient | null {
  if (cached !== undefined) {
    return cached;
  }
  try {
    cached = asClient(loader());
  } catch {
    cached = null;
  }
  return cached;
}

export function isSpeechRecognitionInstalled(): boolean {
  return getSpeechRecognitionModule() != null;
}

export function setSpeechModuleLoaderForTests(next: SpeechModuleLoader | null): void {
  loader = next ?? defaultLoadSpeechModule;
  cached = undefined;
}
