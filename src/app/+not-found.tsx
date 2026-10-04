import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '../components/Screen';
import { colors, fonts, space } from '../theme';

export default function NotFoundScreen() {
  return (
    <Screen style={styles.screen}>
      <Text style={styles.title}>This page is not in the journal.</Text>
      <Link href="/" style={styles.link}>
        Back to notes
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: space.xl,
    justifyContent: 'center',
    gap: space.lg,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
  },
  link: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
  },
});
