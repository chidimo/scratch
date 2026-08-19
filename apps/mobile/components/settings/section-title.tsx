import { ThemedText } from '../themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export const SectionTitle = ({ title }: { title: string }) => {
  const { border } = useThemeColor({}, ['border']);
  return (
    <ThemedText style={[styles.sectionTitle, { borderBottomColor: border }]}>
      {title}
    </ThemedText>
  );
};

const styles = {
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500' as const,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
};
