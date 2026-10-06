import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoteCard } from '../components/NoteCard';
import { Screen } from '../components/Screen';
import { SearchField } from '../components/SearchField';
import { getNotesRepository } from '../db/client';
import { localDatabaseMessage } from '../db/messages';
import type { Note } from '../db/types';
import { noteCountLabel } from '../domain/format';
import { colors, fonts, space } from '../theme';

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (text: string) => {
    try {
      const repository = await getNotesRepository();
      const rows = await repository.listNotes(text);
      setNotes(rows);
      setError(null);
    } catch (loadError) {
      setError(localDatabaseMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        try {
          const repository = await getNotesRepository();
          const rows = await repository.listNotes(query);
          if (active) {
            setNotes(rows);
            setError(null);
          }
        } catch (loadError) {
          if (active) {
            setError(localDatabaseMessage(loadError));
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      })();
      return () => {
        active = false;
      };
    }, [query]),
  );

  const countLabel = query.trim()
    ? notes.length === 1
      ? '1 match'
      : `${notes.length} matches`
    : noteCountLabel(notes.length);

  return (
    <Screen>
      <FlatList
        data={notes}
        keyExtractor={(note) => note.id}
        style={styles.listView}
        contentContainerStyle={styles.list}
        refreshing={loading && notes.length > 0}
        onRefresh={() => void load(query)}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.nav}>
              <Text style={styles.kicker}>Private journal</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                onPress={() => router.push('/settings')}
                style={({ pressed }) => [styles.settings, pressed && styles.settingsPressed]}
              >
                <Text style={styles.settingsGlyph}>···</Text>
              </Pressable>
            </View>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              WhisperVault
            </Text>
            <Text style={styles.subtitle}>Voice notes transcribed on this phone. Nothing is uploaded.</Text>
            <SearchField value={query} onChangeText={setQuery} />
            <Text style={styles.count}>{loading && notes.length === 0 ? 'Opening journal' : countLabel}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.brass} style={styles.spinner} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {query.trim() ? 'Nothing matches that search.' : 'The vault is empty.'}
              </Text>
              <Text style={styles.emptyBody}>
                {query.trim()
                  ? 'Try a word you remember saying. Search only looks through transcripts stored on this device.'
                  : 'Record a voice note. The transcript stays in a local database on this device.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <NoteCard note={item} onPress={() => router.push({ pathname: '/note/[id]', params: { id: item.id } })} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Record a voice note"
          onPress={() => router.push('/record')}
          style={({ pressed }) => [styles.record, pressed && styles.recordPressed]}
        >
          <View style={styles.recordCore} />
          <Text style={styles.recordLabel}>Record</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: space.xl,
    flexGrow: 1,
  },
  header: {
    gap: space.md,
    paddingTop: space.lg,
    paddingBottom: space.lg,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    gap: space.md,
  },
  kicker: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 46,
    width: '100%',
  },
  settings: {
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsPressed: {
    backgroundColor: colors.card,
  },
  settingsGlyph: {
    color: colors.text,
    fontSize: 18,
    letterSpacing: 1,
    marginTop: -6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
  },
  count: {
    color: colors.textMuted,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  separator: {
    height: space.md,
  },
  spinner: {
    marginTop: space.xxl,
  },
  empty: {
    paddingTop: space.xl,
    gap: space.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
  },
  emptyBody: {
    color: colors.textSecondary,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
  },
  listView: {
    flex: 1,
  },
  dock: {
    zIndex: 2,
    elevation: 8,
    paddingTop: space.md,
    paddingHorizontal: space.xl,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  record: {
    minHeight: 60,
    borderRadius: 999,
    backgroundColor: colors.brass,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
  },
  recordPressed: {
    opacity: 0.88,
  },
  recordCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.recording,
  },
  recordLabel: {
    color: colors.bg,
    fontFamily: fonts.bodySemibold,
    fontSize: 17,
  },
});
