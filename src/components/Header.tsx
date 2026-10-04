import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, space } from '../theme';

export function Header({
  title,
  onBack,
  actionLabel,
  onAction,
}: {
  title: string;
  onBack?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingBottom: space.md,
    minHeight: 44,
    gap: space.md,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
  },
  back: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    minWidth: 56,
  },
  action: {
    color: colors.danger,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    minWidth: 56,
    textAlign: 'right',
  },
  spacer: {
    minWidth: 56,
  },
});
