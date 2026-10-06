import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

export function Screen({
  children,
  style,
  edges = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const framed = width > 560;
  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.screen,
          framed ? styles.framed : null,
          edges ? { paddingTop: insets.top } : null,
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.bg,
  },
  framed: {
    maxWidth: 440,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.line,
  },
});
