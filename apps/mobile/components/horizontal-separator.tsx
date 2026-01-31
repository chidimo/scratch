import { StyleSheet, View } from 'react-native'

import { useThemeColor } from '@/hooks/use-theme-color'

export const HorizontalSeparator = ({ style = {} }: { style?: object }) => {
  const { border: borderColor } = useThemeColor({}, ['border'])

  return (
    <View
      style={[styles.separator, { backgroundColor: borderColor, ...style }]}
    />
  )
}

const styles = StyleSheet.create({
  separator: {
    height: 1,
    marginVertical: 2,
    width: '100%',
  },
})
