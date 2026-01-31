import { Pressable, StyleSheet, View } from 'react-native'
import type { ThemePreference } from '@/lib/theme-preference'
import { ThemedText } from '@/components/themed-text'
import { useThemeColor } from '@/hooks/use-theme-color'
import { useThemePreference } from '@/hooks/use-theme-preference'

const OPTIONS: ThemePreference[] = ['light', 'dark', 'system']

export const ThemeSelector = () => {
  const { preference, setPreference } = useThemePreference()
  const {
    tint,
    onTint,
    surface,
    text: textColor,
  } = useThemeColor({}, ['tint', 'onTint', 'surface', 'text'])

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {OPTIONS.map((option) => {
        const active = preference === option
        return (
          <Pressable
            key={option}
            onPress={() => setPreference(option)}
            style={[
              styles.option,
              { backgroundColor: active ? tint : surface },
            ]}
          >
            <ThemedText style={{ color: active ? onTint : textColor }}>
              {option[0].toUpperCase() + option.slice(1)}
            </ThemedText>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  option: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
})
