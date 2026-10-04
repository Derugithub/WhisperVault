import { getLocales } from 'expo-localization';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '../components/Screen';
import { getNotesRepository } from '../db/client';
import { formatElapsed } from '../domain/format';
import { RECOGNITION_LANGUAGE_KEY, languageLabel, resolveRecognitionLanguage } from '../domain/languages';
import { downloadOfflineModel } from '../speech/offlineModel';
import { useVoiceCapture } from '../speech/useVoiceCapture';
import { colors, fonts, space } from '../theme';

export default function RecordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const capture = useVoiceCapture();
  const [lang, setLang] = useState('en-US');
  const [modelMessage, setModelMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const left = useRef(false);
  const closing = useRef(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const repository = await getNotesRepository();
        const stored = await repository.getSetting(RECOGNITION_LANGUAGE_KEY);
        const device = getLocales()[0]?.languageTag ?? null;
        if (active) {
          setLang(resolveRecognitionLanguage(device, stored));
        }
      } catch {
        // English (US) remains the default if the database is not ready yet.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!capture.savedId || left.current) {
      return;
    }
    left.current = true;
    router.replace({ pathname: '/note/[id]', params: { id: capture.savedId } });
  }, [capture.savedId, router]);

  useEffect(() => {
    if (!closing.current || capture.phase !== 'idle' || left.current) {
      return;
    }
    left.current = true;
    router.back();
  }, [capture.phase, router]);

  function leave() {
    if (left.current) {
      return;
    }
    if (capture.phase === 'saving') {
      return;
    }
    if (capture.phase === 'listening') {
      closing.current = true;
      capture.discard();
      setTimeout(() => {
        if (left.current) {
          return;
        }
        left.current = true;
        router.back();
      }, 1200);
      return;
    }
    left.current = true;
    router.back();
  }

  async function downloadModel() {
    setDownloading(true);
    try {
      setModelMessage(await downloadOfflineModel(lang));
    } catch (error) {
      setModelMessage(error instanceof Error ? error.message : 'The offline model could not be downloaded.');
    } finally {
      setDownloading(false);
    }
  }

  const listening = capture.phase === 'listening';
  const saving = capture.phase === 'saving';
  const bars = [0.35, 0.55, 0.9, 0.62, 0.4];

  return (
    <Screen>
      <View style={styles.top}>
        <Pressable onPress={leave} accessibilityRole="button" accessibilityLabel="Cancel recording" hitSlop={8}>
          <Text style={styles.cancel}>{saving ? '' : 'Cancel'}</Text>
        </Pressable>
        <Text style={styles.lang}>{languageLabel(lang)}</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.transcriptWrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.status}>
          {listening ? 'Listening on this device' : saving ? 'Saving' : 'Ready'}
        </Text>
        <Text style={[styles.transcript, !capture.transcript && styles.placeholder]}>
          {capture.transcript || (listening ? 'Speak when you are ready.' : 'Tap record and speak. The transcript appears here.')}
        </Text>
      </ScrollView>

      {capture.message ? <Text style={styles.message}>{capture.message}</Text> : null}
      {modelMessage ? <Text style={styles.message}>{modelMessage}</Text> : null}

      <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Text style={styles.timer}>{formatElapsed(capture.elapsedMs)}</Text>
        <View style={styles.meter} accessibilityElementsHidden>
          {bars.map((height, index) => (
            <View
              key={height}
              style={[
                styles.bar,
                {
                  height: 10 + height * 36 * (listening ? 0.25 + capture.level : 0.15),
                  opacity: listening ? 0.45 + capture.level * 0.55 : 0.35,
                },
              ]}
            />
          ))}
        </View>

        {capture.phase === 'needs-model' && Platform.OS === 'android' ? (
          <Pressable
            accessibilityRole="button"
            disabled={downloading}
            onPress={() => void downloadModel()}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryLabel}>{downloading ? 'Opening download' : 'Download offline model'}</Text>
          </Pressable>
        ) : null}

        {capture.canOpenSettings ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void Linking.openSettings()}
            style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryLabel}>Open system settings</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={listening ? 'Stop and save note' : 'Start recording'}
          disabled={saving}
          onPress={() => {
            if (listening) {
              capture.stop();
              return;
            }
            void capture.start(lang);
          }}
          style={({ pressed }) => [
            styles.record,
            listening && styles.recordLive,
            pressed && styles.pressed,
            saving && styles.disabled,
          ]}
        >
          <View style={[styles.recordMark, listening && styles.recordMarkStop]} />
        </Pressable>
        <Text style={styles.hint}>
          {listening
            ? 'Stop to keep the transcript in the local journal.'
            : 'Transcription uses the operating system speech recognizer. Audio is not sent to a cloud service.'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    minHeight: 44,
  },
  cancel: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    minWidth: 72,
  },
  lang: {
    color: colors.textMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  topSpacer: {
    minWidth: 72,
  },
  transcriptWrap: {
    flexGrow: 1,
    paddingHorizontal: space.xl,
    paddingTop: space.xxl,
    paddingBottom: space.xl,
  },
  status: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: space.lg,
  },
  transcript: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 42,
  },
  placeholder: {
    color: colors.textMuted,
    fontFamily: fonts.displayItalic,
    fontSize: 28,
    lineHeight: 38,
  },
  message: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: space.xl,
    marginBottom: space.md,
  },
  controls: {
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
  },
  timer: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    letterSpacing: 1,
  },
  meter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 48,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: colors.brass,
  },
  record: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: colors.brass,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.sm,
  },
  recordLive: {
    borderColor: colors.recording,
  },
  recordMark: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.recording,
  },
  recordMarkStop: {
    width: 26,
    height: 26,
    borderRadius: 6,
  },
  secondary: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
  },
  hint: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 320,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.45,
  },
});
