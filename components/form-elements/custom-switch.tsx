import { useThemeColor } from "@/hooks/use-theme-color";
import { StyleSheet, Switch, View } from "react-native";
import { ThemedText } from "../themed-text";

type Props = {
  value: boolean;
  label?: string;
  onChange: (value: boolean) => void;
};

export const CustomSwitch = ({ value, label, onChange }: Props) => {
  const {
    border: borderColor,
    mutedText: mutedTextColor,
    tint: tintColor,
    switchKnob: switchKnobColor,
  } = useThemeColor({}, ["border", "mutedText", "tint", "switchKnob"]);

  return (
    <View style={[styles.switchCol, { borderColor }]}>
      {label ? (
        <ThemedText style={[styles.subtle, { color: mutedTextColor }]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  switchCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  subtle: {
    opacity: 0.8,
    fontSize: 12,
  },
});
