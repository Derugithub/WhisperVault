import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AudioPlayback } from '../../components/AudioPlayback';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { deleteLocalFile } from '../../audio/files';
import { getNotesRepository } from '../../db/client';
import type { Note } from '../../db/types';
import { formatNoteFull } from '../../domain/format';
import { colors, fonts, space } from '../../theme';

export default function NoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const noteId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [note, setNote] = useState<Note | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!noteId) {
        setMissing(true);
        return () => {
          active = false;
        };
      }
      void (async () => {
        try {
          const repository = await getNotesRepository();
          const row = await repository.getNote(noteId);
          if (!active) {
            return;
          }
          setNote(row);
          setMissing(!row);
          setError(null);
        } catch (loadError) {
          if (active) {
            setError(loadError instanceof Error ? loadError.message : 'Could not open this note.');
          }
        }
      })();
      return () => {
        active = false;
      };
    }, [noteId]),
  );

  function confirmDelete() {
    if (!note) {
      return;
    }
    Alert.alert('Delete this note?', 'The transcript and recording will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const repository = await getNotesRepository();
            await repository.deleteNote(note.id);
            deleteLocalFile(note.audioUri);
            router.back();
          })();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Header title="Note" onBack={() => router.back()} actionLabel={note ? 'Delete' : undefined} onAction={confirmDelete} />
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {missing ? <Text style={styles.missing}>This note is no longer on the device.</Text> : null}
        {note ? (
          <View style={styles.stack}>
            <Text style={styles.when}>{formatNoteFull(note.createdAt)}</Text>
            {note.audioUri ? (
              <AudioPlayback uri={note.audioUri} />
            ) : (
              <Text style={styles.noAudio}>No audio file was saved with this note. The transcript is stored locally.</Text>
            )}
            <Text selectable style={styles.transcript}>
              {note.transcript}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: space.xxl,
    flexGrow: 1,
  },
  stack: {
    gap: space.lg,
  },
  when: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  transcript: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 36,
  },
  noAudio: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 21,
  },
  missing: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 15,
    marginBottom: space.md,
  },
});
