import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, fonts, space } from '../theme';

export function SearchField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mark} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search transcripts"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="never"
        accessibilityLabel="Search transcripts"
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} accessibilityLabel="Clear search" hitSlop={8}>
          <View style={styles.clear}>
            <View style={styles.clearBar} />
            <View style={[styles.clearBar, styles.clearBarAlt]} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: space.lg,
    minHeight: 52,
  },
  mark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.brass,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 16,
    paddingVertical: 12,
  },
  clear: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBar: {
    position: 'absolute',
    width: 14,
    height: 1.5,
    backgroundColor: colors.textSecondary,
    transform: [{ rotate: '45deg' }],
  },
  clearBarAlt: {
    transform: [{ rotate: '-45deg' }],
  },
});
