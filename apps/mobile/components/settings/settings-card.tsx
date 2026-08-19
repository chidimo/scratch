import { StyleSheet, View, ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export const SettingsCard = ({ style, ...rest }: ViewProps) => {
  const { card } = useThemeColor({}, ['card']);

  return <View style={[styles.card, { backgroundColor: card }, style]} {...rest} />;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});
