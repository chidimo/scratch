/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export function useThemeColor<
  T extends keyof typeof Colors.light & keyof typeof Colors.dark,
>(
  props: {
    light?: Partial<Record<T, string>>;
    dark?: Partial<Record<T, string>>;
  },
  colorNames: T[],
): Record<T, string> {
  const theme = useColorScheme() ?? "light";
  const result = {} as Record<T, string>;

  for (const colorName of colorNames) {
    const colorFromProps = (props[theme] as Partial<Record<T, string>>)?.[
      colorName
    ];
    result[colorName] = colorFromProps || Colors[theme][colorName];
  }

  return result;
}
