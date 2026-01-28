import { useThemeColor } from "@/hooks/use-theme-color";
import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";

export type BtnVariant =
  | "CANCEL"
  | "DANGER"
  | "PRIMARY"
  | "SUCCESS"
  | "SECONDARY";

type Props = {
  title: string | ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: BtnVariant;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  onPress?: (event: GestureResponderEvent) => void;
};

export const CustomButton = (props: Props) => {
  const {
    title = "",
    onPress,
    disabled = false,
    isLoading = false,
    textStyle = {},
    containerStyle = {},
    variant = "SUCCESS",
  } = props;

  const { tint, surface, surfaceAlt, success, danger, onTint, text } =
    useThemeColor({}, [
      "tint",
      "surface",
      "surfaceAlt",
      "success",
      "danger",
      "onTint",
      "text",
    ]);

  const variantBg: Record<BtnVariant, string> = {
    PRIMARY: tint,
    SECONDARY: surface,
    SUCCESS: success,
    DANGER: danger,
    CANCEL: surfaceAlt,
  };
  const variantText: Record<BtnVariant, string> = {
    PRIMARY: onTint,
    SECONDARY: text,
    SUCCESS: onTint,
    DANGER: onTint,
    CANCEL: text,
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={disabled ? () => null : onPress}
      style={({ pressed }) => {
        return [
          typeof title === "string"
            ? {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: 50,
                borderRadius: 4,
                paddingVertical: 8,
                backgroundColor: variantBg[variant],
                opacity: pressed || disabled ? 0.8 : 1,
              }
            : {},
          containerStyle,
        ];
      }}
    >
      <ThemedView
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
        }}
      >
        {isLoading && (
          <ActivityIndicator
            size={22}
            color={variantText[variant]}
            style={[{ marginRight: 3 }]}
          />
        )}
        {typeof title === "string" ? (
          <ThemedText
            style={[
              {
                fontSize: 18,
                fontWeight: "bold",
                color: variantText[variant],
              },
              textStyle,
            ]}
          >
            {title}
          </ThemedText>
        ) : (
          title
        )}
      </ThemedView>
    </Pressable>
  );
};
