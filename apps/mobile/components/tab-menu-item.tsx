import { TabTriggerSlotProps } from 'expo-router/ui';
import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

type Prop = TabTriggerSlotProps & {
  name: string;
  isFocused?: boolean;
  icon: (isFocused: boolean) => React.ReactNode;
};

export const TabMenuItem = ({ name, icon, isFocused, ...rest }: Prop) => {
  const { tabIconDefault, tabIconSelected } = useThemeColor({}, [
    'tabIconDefault',
    'tabIconSelected',
  ]);

  return (
    <Pressable {...rest}>
      <View style={{ alignItems: 'center' }}>
        {icon(isFocused ?? false)}
        <Text
          style={{
            fontSize: 12,
            maxWidth: 100,
            fontWeight: 'bold',
            textAlign: 'center',
            color: isFocused ? tabIconSelected : tabIconDefault,
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>
    </Pressable>
  );
};

export const TabMenuContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { background: backgroundColor, border: borderColor } = useThemeColor(
    {},
    ['background', 'border'],
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        borderTopColor: borderColor,
        paddingTop: 4,
        borderTopWidth: 0.5,
        backgroundColor,
      }}
    >
      {children}
    </View>
  );
};
