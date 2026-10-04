import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RECOGNITION_LANGUAGES } from '../domain/languages';
import { colors, fonts, space } from '../theme';

export function LanguagePicker({
  visible,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selected: string;
  onClose: () => void;
  onSelect: (tag: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.fill}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close language list"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View style={styles.sheet}>
          <Text style={styles.title}>Recognition language</Text>
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {RECOGNITION_LANGUAGES.map((language) => {
              const active = language.tag === selected;
              return (
                <Pressable
                  key={language.tag}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => onSelect(language.tag)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <Text style={styles.label}>{language.label}</Text>
                  <Text style={styles.mark}>{active ? 'On' : ''}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 1,
  },
  sheet: {
    position: 'relative',
    zIndex: 2,
    maxHeight: '70%',
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    paddingTop: space.lg,
    paddingBottom: space.xl,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    paddingHorizontal: space.xl,
    marginBottom: space.md,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    minHeight: 52,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowPressed: {
    backgroundColor: colors.cardPressed,
  },
  label: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 17,
  },
  mark: {
    color: colors.brass,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
});
