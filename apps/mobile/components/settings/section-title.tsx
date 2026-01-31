import { ThemedText } from '../themed-text';

export const SectionTitle = ({ title }: { title: string }) => {
  return <ThemedText style={styles.sectionTitle}>{title}</ThemedText>;
};

const styles = {
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500' as const,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
};
