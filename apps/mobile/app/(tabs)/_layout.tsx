import { Href } from 'expo-router';
import { TabMenuContainer, TabMenuItem } from '@/components/tab-menu-item';
import { Octicons, Feather } from '@expo/vector-icons';
import { Tabs, TabList, TabTrigger, TabSlot } from 'expo-router/ui';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function TabLayout() {
  const { tabIconDefault, tabIconSelected } = useThemeColor({}, [
    'tabIconDefault',
    'tabIconSelected',
  ]);
  const tabItems = [
    {
      name: 'gists',
      displayName: 'Home',
      href: '/gists',
      icon: (isFocused: boolean) => (
        <Feather
          name="book"
          size={24}
          color={isFocused ? tabIconSelected : tabIconDefault}
        />
      ),
    },
    {
      name: 'settings',
      displayName: 'Settings',
      href: '/settings',
      icon: (isFocused: boolean) => (
        <Octicons
          name="gear"
          size={24}
          color={isFocused ? tabIconSelected : tabIconDefault}
        />
      ),
    },
  ];

  return (
    <Tabs>
      <TabSlot />

      <TabMenuContainer>
        {tabItems.map(({ href, ...item }) => (
          <TabTrigger key={item.name} name={item.name} asChild>
            <TabMenuItem name={item.displayName} icon={item.icon} />
          </TabTrigger>
        ))}
      </TabMenuContainer>

      <TabList style={{ display: 'none' }}>
        {tabItems.map((item) => {
          return (
            <TabTrigger
              key={item.name}
              name={item.name}
              href={item.href as Href}
            />
          );
        })}
      </TabList>
    </Tabs>
  );
}
