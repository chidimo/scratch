import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '../themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type FeatherIconName = keyof typeof Feather.glyphMap;

export const SectionTitle = ({
  title,
  icon,
}: {
  title: string;
  icon?: FeatherIconName;
}) => {
  const { mutedText } = useThemeColor({}, ['mutedText']);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      {icon ? <Feather name={icon} size={13} color={mutedText} /> : null}
      <ThemedText
        style={{
          fontSize: 13,
          fontWeight: '700',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          color: mutedText,
        }}
      >
        {title}
      </ThemedText>
    </View>
  );
};
