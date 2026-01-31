import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

import { useThemePreference } from '@/hooks/use-theme-preference';

export const useColorScheme = () => {
  const { preference } = useThemePreference();
  const [systemScheme, setSystemScheme] = useState(
    Appearance.getColorScheme() ?? 'light',
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? 'light');
    });
    return () => subscription.remove();
  }, []);

  return preference === 'system' ? systemScheme : preference;
};
