import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { deleteLocalFile, ensureRecordingsDirectory } from '../audio/files';
import { getNotesRepository } from '../db/client';
import { captureFailureMessage, describeCaptureAvailability, recognitionErrorMessage } from '../domain/errors';
import { createNoteId } from '../domain/ids';
import { localeInstalled } from '../domain/languages';
import { createTranscriptState, reduceTranscript, type TranscriptState } from '../domain/transcript';
import { requestBrowserMicrophone } from './browserMicrophone';
import { readCaptureRoute } from './captureRoute';
import { getSpeechRecognitionModule, type SpeechEvents } from './nativeModule';
import { buildBrowserRecognitionOptions, buildRecognitionOptions, volumeToLevel } from './options';

export type CapturePhase = 'idle' | 'listening' | 'saving' | 'needs-model' | 'blocked';

type SpeechError = { error: string; message: string };

export function useVoiceCapture() {
  const [opening] = useState(() => describeCaptureAvailability(readCaptureRoute(), Platform.OS));
  const [phase, setPhase] = useState<CapturePhase>(opening.phase);
  const [transcript, setTranscript] = useState('');
  const [level, setLevel] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [message, setMessage] = useState<string | null>(opening.message);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [canOpenSettings, setCanOpenSettings] = useState(opening.canOpenSettings);
  const [canStart, setCanStart] = useState(opening.canStart);

  const transcriptState = useRef<TranscriptState>(createTranscriptState());
  const audioUri = useRef<string | null>(null);
  const expectedAudioUri = useRef<string | null>(null);
  const intent = useRef<'save' | 'discard' | null>(null);
  const errorRef = useRef<SpeechError | null>(null);
  const startedAt = useRef<number | null>(null);
  const noteId = useRef<string | null>(null);
  const phaseRef = useRef<CapturePhase>(opening.phase);
  const mounted = useRef(true);

  const persistRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== 'listening' || startedAt.current == null) {
      return;
    }
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - (startedAt.current ?? Date.now()));
    }, 200);
    return () => clearInterval(timer);
  }, [phase]);

  const persist = useCallback(async () => {
    if (mounted.current) {
      setPhase('saving');
    }
    const text = transcriptState.current.display.trim();
    if (!text) {
      deleteLocalFile(audioUri.current);
      if (mounted.current) {
        setMessage(recognitionErrorMessage(errorRef.current?.error ?? 'no-speech'));
        setPhase('idle');
      }
      return;
    }

    try {
      const repository = await getNotesRepository();
      const id = noteId.current ?? createNoteId();
      await repository.saveNote({
        id,
        createdAt: startedAt.current ?? Date.now(),
        transcript: text,
        audioUri: audioUri.current,
      });
      if (mounted.current) {
        setSavedId(id);
        setPhase('idle');
      }
    } catch (error) {
      deleteLocalFile(audioUri.current);
      if (mounted.current) {
        setMessage(error instanceof Error ? error.message : 'Could not save this note on the device.');
        setPhase('idle');
      }
    }
  }, []);

  persistRef.current = persist;

  const onResult = useRef<(event: SpeechEvents['result']) => void>(() => {});
  const onVolume = useRef<(event: SpeechEvents['volumechange']) => void>(() => {});
  const onAudioEnd = useRef<(event: SpeechEvents['audioend']) => void>(() => {});
  const onError = useRef<(event: SpeechEvents['error']) => void>(() => {});
  const onEnd = useRef<() => void>(() => {});

  onResult.current = (event) => {
    const next = reduceTranscript(transcriptState.current, {
      transcript: event.results[0]?.transcript ?? '',
      isFinal: event.isFinal,
    });
    transcriptState.current = next;
    setTranscript(next.display);
  };

  onVolume.current = (event) => {
    setLevel(volumeToLevel(event.value));
  };

  onAudioEnd.current = (event) => {
    if (event.uri) {
      audioUri.current = event.uri;
    }
  };

  onError.current = (event) => {
    if (event.error === 'aborted' && intent.current === 'discard') {
      return;
    }
    errorRef.current = { error: event.error, message: event.message };
  };

  onEnd.current = () => {
    const pending = intent.current;
    intent.current = null;
    setLevel(0);
    if (pending === 'discard') {
      deleteLocalFile(audioUri.current);
      deleteLocalFile(expectedAudioUri.current);
      audioUri.current = null;
      expectedAudioUri.current = null;
      if (mounted.current) {
        setPhase('idle');
      }
      return;
    }
    if (pending === 'save') {
      void persistRef.current();
      return;
    }
    if (errorRef.current && mounted.current) {
      const code = errorRef.current.error;
      setMessage(captureFailureMessage(code, Platform.OS));
      setCanOpenSettings(code === 'not-allowed' && (Platform.OS === 'ios' || Platform.OS === 'android'));
      setPhase('blocked');
      return;
    }
    if (mounted.current && phaseRef.current === 'listening') {
      setPhase('idle');
    }
  };

  useEffect(() => {
    const speech = getSpeechRecognitionModule();
    if (!speech) {
      return;
    }
    const subscriptions = [
      speech.addListener('result', (event) => onResult.current(event)),
      speech.addListener('volumechange', (event) => onVolume.current(event)),
      speech.addListener('audioend', (event) => onAudioEnd.current(event)),
      speech.addListener('error', (event) => onError.current(event)),
      speech.addListener('end', () => onEnd.current()),
    ];
    return () => {
      for (const subscription of subscriptions) {
        subscription.remove();
      }
    };
  }, []);

  const applyBlockedRoute = useCallback((route: ReturnType<typeof readCaptureRoute>) => {
    if (route !== 'needs-install' && route !== 'unavailable') {
      return false;
    }
    const next = describeCaptureAvailability(route, Platform.OS);
    setCanStart(next.canStart);
    setMessage(next.message);
    setCanOpenSettings(next.canOpenSettings);
    setPhase(next.phase);
    return true;
  }, []);

  const refreshAvailability = useCallback(() => {
    if (phaseRef.current === 'listening' || phaseRef.current === 'saving') {
      return;
    }
    const route = readCaptureRoute();
    if (applyBlockedRoute(route)) {
      return;
    }
    setCanStart(true);
  }, [applyBlockedRoute]);

  useEffect(() => {
    refreshAvailability();
  }, [refreshAvailability]);

  const start = useCallback(async (lang: string) => {
    if (phaseRef.current === 'listening' || phaseRef.current === 'saving') {
      return;
    }
    setMessage(null);
    setSavedId(null);
    setCanOpenSettings(false);
    errorRef.current = null;
    audioUri.current = null;
    transcriptState.current = createTranscriptState();
    setTranscript('');
    setElapsedMs(0);
    setLevel(0);

    const speech = getSpeechRecognitionModule();
    const route = readCaptureRoute();

    if (applyBlockedRoute(route) || !speech) {
      return;
    }

    if (route === 'browser') {
      setMessage('Allow the microphone to start recording.');
      const mic = await requestBrowserMicrophone();
      if (!mounted.current) {
        return;
      }
      if (mic === 'denied') {
        setPhase('blocked');
        setMessage(captureFailureMessage('not-allowed', 'web'));
        return;
      }
      if (mic === 'missing') {
        setPhase('blocked');
        setMessage('No microphone is available. Connect one and try again.');
        return;
      }
      const id = createNoteId();
      noteId.current = id;
      startedAt.current = Date.now();
      phaseRef.current = 'listening';
      setMessage(null);
      setPhase('listening');
      try {
        speech.start(buildBrowserRecognitionOptions(lang));
      } catch (error) {
        phaseRef.current = 'blocked';
        setPhase('blocked');
        setMessage(error instanceof Error ? error.message : 'The microphone could not be started.');
      }
      return;
    }

    try {
      if (route === 'needs-model') {
        setPhase('needs-model');
        setMessage('Download the offline speech model for this language, then record again.');
        return;
      }

      if (Platform.OS === 'android') {
        try {
          const supported = await speech.getSupportedLocales({});
          if (!localeInstalled(supported.installedLocales, lang)) {
            setPhase('needs-model');
            setMessage('Download the offline speech model for this language, then record again.');
            return;
          }
        } catch {
          // start() reports a concrete error if the model cannot be used.
        }
      }

      const permission = await speech.requestMicrophonePermissionsAsync();
      if (!permission.granted) {
        setCanOpenSettings(!permission.canAskAgain);
        setMessage(
          permission.canAskAgain
            ? 'Microphone access is needed to record a voice note.'
            : 'Microphone access is off. Enable it in system settings to record.',
        );
        setPhase('blocked');
        return;
      }

      const id = createNoteId();
      noteId.current = id;
      startedAt.current = Date.now();

      const outputDirectory = speech.supportsRecording()
        ? ensureRecordingsDirectory()
        : null;
      const services = Platform.OS === 'android' ? speech.getSpeechRecognitionServices() : [];
      const options = buildRecognitionOptions({
        lang,
        noteId: id,
        outputDirectory,
        useAndroidOnDevicePackage: services.includes('com.google.android.as'),
      });
      expectedAudioUri.current = options.recordingOptions
        ? `${options.recordingOptions.outputDirectory}${options.recordingOptions.outputFileName}`
        : null;

      phaseRef.current = 'listening';
      setPhase('listening');
      speech.start(options);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch (error) {
      phaseRef.current = 'blocked';
      setMessage(error instanceof Error ? error.message : 'The microphone could not be started.');
      setPhase('blocked');
    }
  }, [applyBlockedRoute]);

  const stop = useCallback(() => {
    if (phaseRef.current !== 'listening') {
      return;
    }
    intent.current = 'save';
    setPhase('saving');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    getSpeechRecognitionModule()?.stop();
  }, []);

  const discard = useCallback(() => {
    if (phaseRef.current !== 'listening') {
      return;
    }
    intent.current = 'discard';
    deleteLocalFile(audioUri.current);
    deleteLocalFile(expectedAudioUri.current);
    getSpeechRecognitionModule()?.abort();
  }, []);

  return {
    phase,
    transcript,
    level,
    elapsedMs,
    message,
    savedId,
    canOpenSettings,
    canStart,
    refreshAvailability,
    start,
    stop,
    discard,
  };
}
