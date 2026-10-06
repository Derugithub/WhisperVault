import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header } from '../components/Header';
import { LanguagePicker } from '../components/LanguagePicker';
import { Screen } from '../components/Screen';
import { useClearingNotice } from '../components/useClearingNotice';
import { deleteLocalFile } from '../audio/files';
import { getNotesRepository } from '../db/client';
import { localDatabaseMessage } from '../db/messages';
import { languageLabel } from '../domain/languages';
import { FAILED_DOWNLOAD_MESSAGE, shouldShowOfflineModelDownload } from '../speech/downloadNotice';
import { offlineModelDownloadSupported } from '../speech/nativeModule';
import { downloadOfflineModel } from '../speech/offlineModel';
import { readRecognitionLanguage, writeRecognitionLanguage } from '../speech/languageSetting';
import { colors, fonts, space } from '../theme';

export default function SettingsScreen() {
  const router = useRouter();
  const [lang, setLang] = useState('en-US');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [noteCount, setNoteCount] = useState(0);
  const [status, setStatus] = useClearingNotice();
  const [busy, setBusy] = useState(false);
  const langTicket = useRef(0);
  const showOfflineDownload = shouldShowOfflineModelDownload(Platform.OS, offlineModelDownloadSupported());

  const refresh = useCallback(async () => {
    const ticket = langTicket.current;
    const repository = await getNotesRepository();
    const next = await readRecognitionLanguage();
    if (ticket !== langTicket.current) {
      return;
    }
    setLang(next);
    const notes = await repository.listNotes('');
    if (ticket !== langTicket.current) {
      return;
    }
    setNoteCount(notes.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void refresh().catch((error: unknown) => {
        if (active) {
          setStatus(localDatabaseMessage(error));
        }
      });
      return () => {
        active = false;
      };
    }, [refresh]),
  );

  async function chooseLanguage(tag: string) {
    langTicket.current += 1;
    setLang(tag);
    setPickerOpen(false);
    try {
      await writeRecognitionLanguage(tag);
      setStatus(null);
    } catch (error) {
      setStatus(localDatabaseMessage(error));
    }
  }

  async function downloadModel() {
    setBusy(true);
    try {
      setStatus(await downloadOfflineModel(lang));
    } catch {
      setStatus(FAILED_DOWNLOAD_MESSAGE);
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteAll() {
    Alert.alert('Delete every note?', 'Transcripts and recordings stored on this device will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete all',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const repository = await getNotesRepository();
            const notes = await repository.deleteAllNotes();
            for (const note of notes) {
              deleteLocalFile(note.audioUri);
            }
            setNoteCount(0);
            setStatus('The local journal is empty.');
          })();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Header title="Settings" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Recognition language</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change recognition language, ${languageLabel(lang)}`}
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [styles.selector, pressed && styles.rowPressed]}
        >
          <Text style={styles.rowLabel}>{languageLabel(lang)}</Text>
          <Text style={styles.rowValue}>Change</Text>
        </Pressable>

        <Text style={styles.section}>On this device</Text>
        <View style={styles.card}>
          <Text style={styles.body}>
            Notes, transcripts, and recordings stay in this app’s local database and files. There is no account and no sync.
          </Text>
          {Platform.OS === 'web' ? (
            <Text style={styles.body}>
              In this browser, transcription uses the browser’s speech recognition. Notes you save stay in local storage on this device.
            </Text>
          ) : (
            <Text style={styles.body}>
              Transcription uses the operating system’s on-device speech recognizer. WhisperVault does not upload recordings to a cloud speech service.
            </Text>
          )}
          {showOfflineDownload ? (
            <Text style={styles.body}>
              On Android, the system may need an offline speech model the first time you use a language. That download is the language pack, not your note.
            </Text>
          ) : null}
          <Text style={styles.meta}>
            {noteCount === 1 ? '1 note stored here' : `${noteCount} notes stored here`}
          </Text>
        </View>

        {showOfflineDownload ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void downloadModel()}
            style={({ pressed }) => [styles.button, pressed && styles.rowPressed]}
          >
            <Text style={styles.buttonLabel}>{busy ? 'Opening download' : 'Download offline speech model'}</Text>
          </Pressable>
        ) : null}

        {status ? <Text style={styles.status}>{status}</Text> : null}

        <Pressable
          accessibilityRole="button"
          onPress={confirmDeleteAll}
          style={({ pressed }) => [styles.danger, pressed && styles.rowPressed]}
        >
          <Text style={styles.dangerLabel}>Delete all notes</Text>
        </Pressable>
      </ScrollView>
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
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: 48,
    gap: space.md,
  },
  section: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: space.md,
  },
  selector: {
    minHeight: 52,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  rowPressed: {
    backgroundColor: colors.cardPressed,
  },
  rowLabel: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  rowValue: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  card: {
    gap: space.md,
    padding: space.lg,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  body: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  buttonLabel: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
  },
  status: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  danger: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.lg,
  },
  dangerLabel: {
    color: colors.danger,
    fontFamily: fonts.bodySemibold,
    fontSize: 16,
  },
});
