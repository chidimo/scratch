import { default as ExpoCheckBox } from "expo-checkbox";

import { useThemeColor } from "@/hooks/use-theme-color";
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

type Props = {
  label?: string;
  boxPosition?: "left" | "right";
  error?: string | any[];
  disabled?: boolean;
  checked?: boolean;
  checkboxStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  onValueChange: (value: boolean) => void;
};

export const Checkbox = (props: Props) => {
  const {
    label,
    error,
    disabled = false,
    checked = false,
    containerStyle,
    boxPosition = "left",
    onValueChange,
    checkboxStyle = {},
  } = props;

  const { text: textColor, danger: dangerColor } = useThemeColor({}, [
    "text",
    "danger",
  ]);

  return (
    <Pressable
      style={[styles.container, containerStyle]}
      onPress={() => onValueChange(!checked)}
    >
      <View
        style={{
          display: "flex",
          flexDirection: boxPosition === "left" ? "row" : "row-reverse",
          alignItems: "center",
        }}
      >
        <ExpoCheckBox
          style={[{ width: 36, height: 36 }, checkboxStyle]}
          accessible
          accessibilityLabel={label}
          value={checked}
          disabled={disabled}
          onValueChange={onValueChange}
        />
        <Text
          style={{
            marginLeft: boxPosition === "left" ? 10 : 0,
            marginRight: boxPosition === "left" ? 0 : 10,
            color: textColor,
          }}
        >
          {label}
        </Text>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: dangerColor }]}>{error}</Text>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
  },
  errorText: {},
});
