import { View } from 'react-native'
import type { ViewProps } from 'react-native'

import { useThemeColor } from '@/hooks/use-theme-color'

export type ThemedViewProps = ViewProps & {
  lightColor?: string
  darkColor?: string
}

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const { background: backgroundColor } = useThemeColor(
    {
      light: lightColor ? { background: lightColor } : {},
      dark: darkColor ? { background: darkColor } : {},
    },
    ['background'],
  )

  return <View style={[{ backgroundColor }, style]} {...otherProps} />
}
