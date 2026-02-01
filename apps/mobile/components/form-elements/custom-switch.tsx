import { useThemeColor } from '@/hooks/use-theme-color';
import { Switch } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

type Props = {
  value: boolean;
  label?: string;
  onChange: (value: boolean) => void;
  containerStyle?: object;
};

export const CustomSwitch = ({
  value,
  label,
  onChange,
  containerStyle,
}: Props) => {
  const {
    tint: tintColor,
    border: borderColor,
    mutedText: mutedTextColor,
    switchKnob: switchKnobColor,
  } = useThemeColor({}, ['border', 'mutedText', 'tint', 'switchKnob']);

  return (
    <ThemedView
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 8, borderColor },
        containerStyle,
      ]}
    >
      {label ? (
        <ThemedText
          style={[{ opacity: 0.8, fontSize: 12, color: mutedTextColor }]}
        >
          {label}
        </ThemedText>
      ) : null}
      <Switch
        value={value}
        trackColor={{ false: borderColor, true: tintColor }}
        thumbColor={switchKnobColor}
        onValueChange={(checked) => {
          onChange(checked);
        }}
      />
    </ThemedView>
  );
};
