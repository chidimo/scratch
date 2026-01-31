/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native'

const tintColorLight = '#2563EB'
const tintColorDark = '#F97316'

export const Colors = {
  light: {
    text: '#09090B',
    background: '#FFFFFF',
    tint: tintColorLight,
    onTint: '#FFFFFF',
    icon: '#71717B',
    tabIconDefault: '#71717B',
    tabIconSelected: tintColorLight,
    border: '#E4E4E7',
    mutedText: '#71717B',
    surface: '#F4F4F5',
    surfaceAlt: '#E5E7EB',
    card: '#FFFFFF',
    success: '#22C55E',
    danger: '#E7000B',
    overlay: 'rgba(0, 0, 0, 0.3)',
    switchKnob: '#FFFFFF',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0B0F14',
    tint: tintColorDark,
    onTint: '#FFFFFF',
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorDark,
    border: '#1F2937',
    mutedText: '#94A3B8',
    surface: '#111827',
    surfaceAlt: '#1F2937',
    card: '#111827',
    success: '#22C55E',
    danger: '#FB7185',
    overlay: 'rgba(0, 0, 0, 0.5)',
    switchKnob: '#1F2937',
  },
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
})
