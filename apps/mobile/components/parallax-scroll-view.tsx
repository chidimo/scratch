import { StyleSheet } from 'react-native'
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollOffset,
} from 'react-native-reanimated'
import type { PropsWithChildren, ReactElement } from 'react'

import { ThemedView } from '@/components/themed-view'
import { Colors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useThemeColor } from '@/hooks/use-theme-color'

const HEADER_HEIGHT = 250

type Props = PropsWithChildren<{
  headerHeight?: number
  headerImage?: ReactElement | null
  headerBackgroundColor?: { dark: string; light: string }
}>

export default function ParallaxScrollView({
  children,
  headerImage,
  headerHeight = HEADER_HEIGHT,
  headerBackgroundColor = {
    dark: Colors.dark.surfaceAlt,
    light: Colors.light.surface,
  },
}: Props) {
  const { background: backgroundColor } = useThemeColor({}, ['background'])
  const colorScheme = useColorScheme() ?? 'light'
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useScrollOffset(scrollRef)
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-headerHeight, 0, headerHeight],
            [-headerHeight / 2, 0, headerHeight * 0.75],
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-headerHeight, 0, headerHeight],
            [2, 1, 1],
          ),
        },
      ],
    }
  })

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={{ backgroundColor, flex: 1 }}
      scrollEventThrottle={16}
    >
      {headerImage ? (
        <Animated.View
          style={[
            {
              backgroundColor: headerBackgroundColor[colorScheme],
              height: headerHeight,
              overflow: 'hidden',
            },
            headerAnimatedStyle,
          ]}
        >
          {headerImage}
        </Animated.View>
      ) : null}
      <ThemedView style={styles.content}>{children}</ThemedView>
    </Animated.ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
    overflow: 'hidden',
  },
})
