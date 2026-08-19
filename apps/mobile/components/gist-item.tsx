import { Note } from '@scratch/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export const GistItem = ({ gist }: { gist: Note }) => {
  const router = useRouter();
  const privacyLabel = gist.is_public ? 'Public' : 'Private';
  const {
    surfaceAlt: pillBackground,
    text: pillText,
    border,
    card,
    success,
  } = useThemeColor({}, ['surfaceAlt', 'text', 'border', 'card', 'success']);

  return (
    <TouchableOpacity
      style={[
        styles.noteItem,
        { borderColor: border, backgroundColor: card },
      ]}
      onPress={() => router.push(`/note/${gist.id}`)}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteHeaderLeft}>
          <ThemedText style={styles.noteTitle}>{gist.title}</ThemedText>
        </View>
        <ThemedText style={styles.noteDate}>
          {new Date(gist.updated_at).toLocaleDateString()}
        </ThemedText>
      </View>
      <View style={styles.noteFooter}>
        <View style={styles.syncStatus}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  gist.sync_status === 'synced' ? success : '#FF9800',
              },
            ]}
          />
          <ThemedText style={styles.statusText}>{gist.sync_status}</ThemedText>
        </View>
        <View style={[styles.privacyPill, { backgroundColor: pillBackground }]}>
          <ThemedText style={[styles.privacyText, { color: pillText }]}>
            {privacyLabel}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  noteItem: {
    marginVertical: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  ownerLink: {
    marginTop: 2,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  noteDate: {
    fontSize: 12,
  },
  notePreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  privacyText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  privacyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
