import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatNoteWhen } from '../domain/format';
import { previewTranscript } from '../domain/transcript';
import type { Note } from '../db/types';
import { colors, fonts, space } from '../theme';

export function NoteCard({ note, onPress }: { note: Note; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open note from ${formatNoteWhen(note.createdAt, new Date())}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.rail, note.audioUri ? styles.railAudio : null]} />
      <View style={styles.copy}>
        <Text style={styles.when}>{formatNoteWhen(note.createdAt, new Date())}</Text>
        <Text style={styles.transcript} numberOfLines={3}>
          {previewTranscript(note.transcript)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  pressed: {
    backgroundColor: colors.cardPressed,
  },
  rail: {
    width: 3,
    backgroundColor: colors.lineStrong,
  },
  railAudio: {
    backgroundColor: colors.brass,
  },
  copy: {
    flex: 1,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    gap: space.sm,
  },
  when: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  transcript: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 27,
  },
});
