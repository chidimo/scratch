declare module 'react-native-syntax-highlighter' {
  import * as React from 'react';
    import { TextStyle, ViewStyle } from 'react-native';

  export type SyntaxHighlighterStyle = Record<string, TextStyle | ViewStyle>;

  export interface SyntaxHighlighterProps {
    language?: string;
    style?: SyntaxHighlighterStyle;
    customStyle?: ViewStyle;
    highlighter?: string;
    PreTag?: React.ComponentType<any>;
    CodeTag?: React.ComponentType<any>;
    children: string | string[];
  }

  const SyntaxHighlighter: React.ComponentType<SyntaxHighlighterProps>;
  export = SyntaxHighlighter;
}

declare module 'react-syntax-highlighter/styles/prism' {
  import { SyntaxHighlighterStyle } from 'react-native-syntax-highlighter';

  export const oneDark: SyntaxHighlighterStyle;
  export const oneLight: SyntaxHighlighterStyle;
}

declare module 'react-syntax-highlighter/styles/hljs' {
  import { SyntaxHighlighterStyle } from 'react-native-syntax-highlighter';

  export const atomOneDark: SyntaxHighlighterStyle;
  export const atomOneLight: SyntaxHighlighterStyle;
}
