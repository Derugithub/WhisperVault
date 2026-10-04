export type RecognitionRecordingOptions = {
  persist: true;
  outputDirectory: string;
  outputFileName: string;
  outputSampleRate: 16000;
  outputEncoding: 'pcmFormatInt16';
};

export type RecognitionStartOptions = {
  lang: string;
  interimResults: true;
  continuous: true;
  addsPunctuation: true;
  requiresOnDeviceRecognition: true;
  iosTaskHint: 'dictation';
  volumeChangeEventOptions: {
    enabled: true;
    intervalMillis: number;
  };
  recordingOptions?: RecognitionRecordingOptions;
  androidRecognitionServicePackage?: 'com.google.android.as';
};

export function buildRecognitionOptions(input: {
  lang: string;
  noteId: string;
  outputDirectory: string | null;
  useAndroidOnDevicePackage: boolean;
}): RecognitionStartOptions {
  const options: RecognitionStartOptions = {
    lang: input.lang,
    interimResults: true,
    continuous: true,
    addsPunctuation: true,
    requiresOnDeviceRecognition: true,
    iosTaskHint: 'dictation',
    volumeChangeEventOptions: {
      enabled: true,
      intervalMillis: 80,
    },
  };

  if (input.outputDirectory) {
    const directory = input.outputDirectory.endsWith('/')
      ? input.outputDirectory
      : `${input.outputDirectory}/`;
    options.recordingOptions = {
      persist: true,
      outputDirectory: directory,
      outputFileName: `${input.noteId}.wav`,
      outputSampleRate: 16000,
      outputEncoding: 'pcmFormatInt16',
    };
  }

  if (input.useAndroidOnDevicePackage) {
    options.androidRecognitionServicePackage = 'com.google.android.as';
  }

  return options;
}

export function volumeToLevel(value: number): number {
  const clamped = Math.min(10, Math.max(-2, value));
  return (clamped + 2) / 12;
}
