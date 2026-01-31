import { useThemeColor } from "@/hooks/use-theme-color";
import { Ref } from "react";
import {
  KeyboardTypeOptions,
  StyleProp,
  Text,
  TextInput,
  TextStyle,
  ViewStyle,
} from "react-native";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";

type ReturnKeyTypeOptions = "done" | "go" | "next" | "search" | "send";

type AutoCompleteOptions =
  | "name"
  | "off"
  | "cc-csc"
  | "cc-exp"
  | "cc-exp-month"
  | "cc-exp-year"
  | "cc-number"
  | "email"
  | "password"
  | "postal-code"
  | "street-address"
  | "tel"
  | "username";

type Props = {
  label?: string;
  value?: any;
  disabled?: boolean;
  multiline?: boolean;
  selectTextOnFocus?: boolean;

  error?: any;
  placeholder?: string;

  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;

  returnKeyType?: ReturnKeyTypeOptions;
  keyboardType?: KeyboardTypeOptions;
  autoComplete?: AutoCompleteOptions;

  onBlur?: (...args: any[]) => any;
  onChangeText: (...args: any[]) => any;
  onSubmitEditing?: (...args: any[]) => any;
};

export const CustomInput = (props: Props, ref?: Ref<TextInput>) => {
  const {
    label,
    value,
    error,
    disabled = false,
    multiline = false,
    containerStyle = {},
    textStyle = {},
    onBlur,
    onChangeText,
    onSubmitEditing,
    placeholder = "Enter value",
    keyboardType = "default",
    returnKeyType,
    selectTextOnFocus,
    autoComplete = "off",
  } = props;

  const {
    border: borderColor,
    mutedText: placeholderColor,
    text: textColor,
    background: backgroundColor,
    danger: dangerColor,
  } = useThemeColor({}, [
    "border",
    "mutedText",
    "text",
    "background",
    "danger",
  ]);

  return (
    <ThemedView
      style={[
        {
          width: "100%",
          marginBottom: 10,
          backgroundColor: "transparent",
        },
        containerStyle,
      ]}
    >
      {label ? <ThemedText>{label}</ThemedText> : null}
      <TextInput
        ref={ref}
        value={value}
        editable={!disabled}
        multiline={multiline}
        selectTextOnFocus={selectTextOnFocus}
        placeholder={placeholder}
        autoComplete={autoComplete}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        onBlur={onBlur}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholderTextColor={placeholderColor}
        style={[
          {
            height: 50,
            width: "100%",
            fontSize: 18,
            borderWidth: 1,
            borderRadius: 4,
            paddingHorizontal: 10,
            color: textColor,
            backgroundColor,
            borderColor: error ? dangerColor : borderColor,
          },
          textStyle,
        ]}
      />

      {error && <Text style={{ color: dangerColor }}>{error}</Text>}
    </ThemedView>
  );
};
