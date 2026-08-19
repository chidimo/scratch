import { Pressable, StyleSheet, View } from 'react-native';
import type { ThemePreference } from '@/lib/theme-preference';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { SectionTitle } from './section-title';
import { SettingsCard } from './settings-card';

const OPTIONS: ThemePreference[] = ['light', 'dark', 'system'];

export const ThemeSelector = () => {
  const { preference, setPreference } = useThemePreference();
  const {
    tint,
    onTint,
    surface,
    text: textColor,
  } = useThemeColor({}, ['tint', 'onTint', 'surface', 'text']);

  return (
    <SettingsCard>
      <SectionTitle title="Theme" icon="sun" />
      <View style={styles.options}>
        {OPTIONS.map((option) => {
          const active = preference === option;
          return (
            <Pressable
              key={option}
              onPress={() => setPreference(option)}
              style={[
                styles.option,
                { backgroundColor: active ? tint : surface },
              ]}
            >
              <ThemedText
                style={{
                  fontWeight: active ? '700' : '500',
                  color: active ? onTint : textColor,
                }}
              >
                {option[0].toUpperCase() + option.slice(1)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </SettingsCard>
  );
};

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 10,
  },
});
