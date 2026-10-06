import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguagePicker } from '../components/LanguagePicker';
import { Screen } from '../components/Screen';
import { useClearingNotice } from '../components/useClearingNotice';
import { localDatabaseMessage } from '../db/messages';
import { formatElapsed } from '../domain/format';
import { languageLabel } from '../domain/languages';
import { FAILED_DOWNLOAD_MESSAGE } from '../speech/downloadNotice';
import { downloadOfflineModel } from '../speech/offlineModel';
import { readRecognitionLanguage, writeRecognitionLanguage } from '../speech/languageSetting';
import { useVoiceCapture } from '../speech/useVoiceCapture';
import { colors, fonts, space } from '../theme';

export default function RecordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const capture = useVoiceCapture();
  const [lang, setLang] = useState('en-US');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [modelMessage, setModelMessage] = useClearingNotice();
  const [downloading, setDownloading] = useState(false);
  const left = useRef(false);
  const closing = useRef(false);
  const langTicket = useRef(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const ticket = langTicket.current;
      void readRecognitionLanguage()
        .then((next) => {
          if (active && ticket === langTicket.current) {
            setLang(next);
          }
        })
        .catch(() => {
          // English (US) remains the default if the database is not ready yet.
        });
      capture.refreshAvailability();
      return () => {
        active = false;
      };
    }, [capture.refreshAvailability]),
  );

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

  async function chooseLanguage(tag: string) {
    langTicket.current += 1;
    setLang(tag);
    setPickerOpen(false);
    try {
      await writeRecognitionLanguage(tag);
    } catch (error) {
      setModelMessage(localDatabaseMessage(error));
    }
  }

  async function downloadModel() {
    setDownloading(true);
    try {
      setModelMessage(await downloadOfflineModel(lang));
    } catch {
      setModelMessage(FAILED_DOWNLOAD_MESSAGE);
    } finally {
      setDownloading(false);
    }
  }

  const listening = capture.phase === 'listening';
  const saving = capture.phase === 'saving';
  const showRecord = capture.canStart || listening || saving;
  const bars = [0.35, 0.55, 0.9, 0.62, 0.4];
  const status = listening
    ? 'Listening'
    : saving
      ? 'Saving'
      : capture.phase === 'needs-model'
        ? 'Offline model'
        : capture.phase === 'blocked'
          ? 'Action needed'
          : 'Ready';
  const placeholder = listening
    ? 'Speak when you are ready.'
    : capture.message
      ? capture.message
      : 'Tap record and speak. The transcript appears here.';

  return (
    <Screen>
      <View style={styles.top}>
        <Pressable onPress={leave} accessibilityRole="button" accessibilityLabel="Cancel recording" hitSlop={8}>
          <Text style={styles.cancel}>{saving ? '' : 'Cancel'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change recognition language, ${languageLabel(lang)}`}
          disabled={listening || saving}
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [styles.langButton, (listening || saving) && styles.disabled, pressed && styles.pressed]}
        >
          <Text style={styles.lang}>{languageLabel(lang)}</Text>
        </Pressable>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView style={styles.transcriptScroll} contentContainerStyle={styles.transcriptWrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.status}>{status}</Text>
        <Text style={[styles.transcript, !capture.transcript && styles.placeholder]}>
          {capture.transcript || placeholder}
        </Text>
      </ScrollView>

      {modelMessage ? <Text style={styles.message}>{modelMessage}</Text> : null}

      <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Text style={styles.timer}>{formatElapsed(capture.elapsedMs)}</Text>
        <View style={styles.meter} accessibilityElementsHidden>
          {bars.map((height) => (
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

        {showRecord ? (
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
        ) : null}
        {showRecord ? (
          <Text style={styles.hint}>
            {listening
              ? 'Stop to keep the transcript in the local journal.'
              : Platform.OS === 'web'
                ? 'Stop to keep the transcript in this browser.'
                : 'Transcription uses the speech recognizer on this phone. The note stays on this device.'}
          </Text>
        ) : null}
      </View>

      <LanguagePicker
        visible={pickerOpen}
        selected={lang}
        onClose={() => setPickerOpen(false)}
        onSelect={(tag) => void chooseLanguage(tag)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    minHeight: 56,
  },
  cancel: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    minWidth: 72,
  },
  langButton: {
    flex: 1,
    minHeight: 44,
    marginHorizontal: space.sm,
    paddingHorizontal: space.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lang: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  topSpacer: {
    minWidth: 72,
  },
  transcriptScroll: {
    flex: 1,
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
    zIndex: 2,
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    backgroundColor: colors.bg,
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
