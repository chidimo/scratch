import { useEffect, useMemo, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

export const HorizontalFileTabs = ({
  files,
  activeFile,
  onChange,
}: {
  files: string[];
  activeFile: string | null;
  onChange: (file: string) => void;
}) => {
  const {
    tint: indicatorColor,
    mutedText,
    text,
  } = useThemeColor({}, ['tint', 'mutedText', 'text']);
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorLeft = useMemo(() => new Animated.Value(0), []);
  const indicatorWidth = useMemo(() => new Animated.Value(0), []);
  const tabWidth =
    containerWidth && files.length ? containerWidth / files.length : 0;

  useEffect(() => {
    const activeIndex = Math.max(0, files.indexOf(activeFile ?? ''));
    if (!tabWidth) {
      return;
    }

    Animated.parallel([
      Animated.spring(indicatorLeft, {
        toValue: tabWidth * activeIndex,
        useNativeDriver: false,
      }),
      Animated.spring(indicatorWidth, {
        toValue: tabWidth,
        useNativeDriver: false,
      }),
    ]).start();
  }, [activeFile, files, indicatorLeft, indicatorWidth, tabWidth]);

  return (
    <View
      style={styles.fileTabs}
      onLayout={(event) => {
        setContainerWidth(event.nativeEvent.layout.width);
      }}
    >
      <View style={styles.fileTabsContent}>
        {files.map((file, index) => {
          const isActive = file === activeFile;
          return (
            <TouchableOpacity
              key={file}
              onPress={() => onChange(file)}
              style={[
                styles.fileTabButton,
                isActive && styles.fileTabButtonActive,
                tabWidth ? { width: tabWidth } : null,
              ]}
            >
              <ThemedText
                style={[
                  styles.fileTabText,
                  { color: isActive ? text : mutedText },
                  isActive && styles.fileTabTextActive,
                ]}
                numberOfLines={1}
              >
                {`File ${index + 1}`}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
        <Animated.View
          style={[
            styles.fileTabIndicator,
            {
              left: indicatorLeft,
              width: indicatorWidth,
              backgroundColor: indicatorColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fileTabs: {
    marginBottom: 12,
  },
  fileTabsContent: {
    paddingBottom: 6,
    flexDirection: 'row',
    position: 'relative',
  },
  fileTabButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  fileTabButtonActive: {},
  fileTabText: {
    fontSize: 16,
    opacity: 0.6,
  },
  fileTabTextActive: {
    opacity: 1,
    fontWeight: '600',
  },
  fileTabIndicator: {
    position: 'absolute',
    height: 2,
    bottom: 0,
    backgroundColor: '#2563eb',
    borderRadius: 999,
  },
});
