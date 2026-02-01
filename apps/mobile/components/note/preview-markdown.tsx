import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

type Props = {
  title: string;
  content: string;
};

export const PreviewMarkdown = ({ content, title }: Props) => {
  return (
    <ThemedView style={styles.previewContainer}>
      <ThemedText style={styles.previewTitle}>{title || 'Untitled'}</ThemedText>
      <Markdown style={markdownStyles}>
        {content || 'No content to preview'}
      </Markdown>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    flex: 1,
  },
  previewTitle: {
    padding: 8,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});

const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 24,
    padding: 8,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginBottom: 16,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginBottom: 12,
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 12,
  },
  code_inline: {
    backgroundColor: '#f5f5f5',
    padding: 2,
    borderRadius: 3,
    fontFamily: 'monospace' as const,
  },
  code_block: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    fontFamily: 'monospace' as const,
    marginBottom: 12,
  },
  fence: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    fontFamily: 'monospace' as const,
    marginBottom: 12,
  },
  list_item: {
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 12,
  },
  ordered_list: {
    marginBottom: 12,
  },
  blockquote: {
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
    paddingLeft: 12,
    marginBottom: 12,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline' as const,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  strong: {
    fontWeight: 'bold' as const,
  },
};
