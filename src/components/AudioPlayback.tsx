import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, space } from '../theme';

export function AudioPlayback({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'doNotMix',
    });
  }, []);

  const playing = status.playing;
  const duration = status.duration > 0 ? status.duration : 0;
  const progress = duration > 0 ? Math.min(1, status.currentTime / duration) : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={playing ? 'Pause recording' : 'Play recording'}
      onPress={() => {
        if (playing) {
          player.pause();
          return;
        }
        if (duration > 0 && status.currentTime >= duration - 0.05) {
          void player.seekTo(0);
        }
        player.play();
      }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.play}>
        <Text style={styles.playGlyph}>{playing ? 'II' : '▶'}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.label}>{playing ? 'Playing recording' : 'Play recording'}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: 16,
    backgroundColor: colors.brassSoft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: {
    opacity: 0.8,
  },
  play: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: {
    color: colors.bg,
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    marginLeft: 1,
  },
  meta: {
    flex: 1,
    gap: space.sm,
  },
  label: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
  },
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.lineStrong,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.brass,
  },
});
