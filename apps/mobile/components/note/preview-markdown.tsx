import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ComponentType } from 'react';
import { StyleSheet, Text } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { oneDark, oneLight } from 'react-syntax-highlighter/styles/prism';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

const SyntaxHighlighter = (
  require('react-native-syntax-highlighter').default ??
  require('react-native-syntax-highlighter')
) as ComponentType<{
  language?: string;
  style?: Record<string, unknown>;
  customStyle?: Record<string, unknown>;
  highlighter?: string;
  PreTag?: ComponentType<any>;
  CodeTag?: ComponentType<any>;
  children: string | string[];
}>;

type Props = {
  title: string;
  content: string;
};

export const PreviewMarkdown = ({ content, title }: Props) => {
  const colorScheme = useColorScheme();
  const { text, mutedText, border, surface, surfaceAlt, tint } = useThemeColor(
    {},
    ['text', 'mutedText', 'border', 'surface', 'surfaceAlt', 'tint'],
  );
  const markdownStyles = createMarkdownStyles({
    text,
    mutedText,
    border,
    surface,
    surfaceAlt,
    tint,
  });
  const syntaxStyle = colorScheme === 'dark' ? oneDark : oneLight;
  const markdownRules = createMarkdownRules({
    surfaceAlt,
    syntaxStyle,
  });

  return (
    <ThemedView style={styles.previewContainer}>
      <ThemedText style={[styles.previewTitle, { borderBottomColor: border }]}>
        {title || 'Untitled'}
      </ThemedText>
      <Markdown style={markdownStyles} rules={markdownRules}>
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
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});

const createMarkdownStyles = ({
  text,
  mutedText,
  border,
  surface,
  surfaceAlt,
  tint,
}: {
  text: string;
  mutedText: string;
  border: string;
  surface: string;
  surfaceAlt: string;
  tint: string;
}) => ({
  body: {
    padding: 8,
    fontSize: 16,
    lineHeight: 24,
    color: text,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginBottom: 16,
    color: text,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginBottom: 12,
    color: text,
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 8,
    color: text,
  },
  paragraph: {
    marginBottom: 12,
    color: text,
  },
  code_inline: {
    backgroundColor: surfaceAlt,
    padding: 2,
    borderRadius: 3,
    fontFamily: 'monospace' as const,
    color: text,
  },
  code_block: {
    backgroundColor: surfaceAlt,
    padding: 12,
    borderRadius: 6,
    fontFamily: 'monospace' as const,
    marginBottom: 12,
    color: text,
  },
  fence: {
    backgroundColor: surfaceAlt,
    padding: 12,
    borderRadius: 6,
    fontFamily: 'monospace' as const,
    marginBottom: 12,
    color: text,
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
    backgroundColor: surface,
    borderLeftWidth: 4,
    borderLeftColor: border,
    paddingLeft: 12,
    marginBottom: 12,
  },
  blockquote_text: {
    color: mutedText,
  },
  link: {
    color: tint,
    textDecorationLine: 'underline' as const,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  strong: {
    fontWeight: 'bold' as const,
  },
});

const createMarkdownRules = ({
  surfaceAlt,
  syntaxStyle,
}: {
  surfaceAlt: string;
  syntaxStyle: typeof oneDark;
}) => ({
  fence: (node: { content: string; info?: string; key: string }) => {
    const language = node.info?.trim() || 'text';
    return (
      <SyntaxHighlighter
        key={node.key}
        language={language}
        style={syntaxStyle}
        highlighter="prism"
        PreTag={Text}
        CodeTag={Text}
        customStyle={{
          backgroundColor: surfaceAlt,
          padding: 12,
          borderRadius: 6,
          marginBottom: 12,
        }}
      >
        {node.content}
      </SyntaxHighlighter>
    );
  },
  code_block: (node: { content: string; key: string }) => {
    return (
      <SyntaxHighlighter
        key={node.key}
        language="text"
        style={syntaxStyle}
        highlighter="prism"
        PreTag={Text}
        CodeTag={Text}
        customStyle={{
          backgroundColor: surfaceAlt,
          padding: 12,
          borderRadius: 6,
          marginBottom: 12,
        }}
      >
        {node.content}
      </SyntaxHighlighter>
    );
  },
});
