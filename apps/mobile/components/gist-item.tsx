import { Note } from '@scratch/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { accentForId } from '@/constants/theme';

export const GistItem = ({ gist }: { gist: Note }) => {
  const router = useRouter();
  const privacyLabel = gist.is_public ? 'Public' : 'Private';
  const {
    surfaceAlt: pillBackground,
    text: pillText,
    card,
    mutedText,
    danger,
  } = useThemeColor({}, ['surfaceAlt', 'text', 'card', 'mutedText', 'danger']);
  const accentColor = accentForId(gist.id);

  return (
    <TouchableOpacity
      style={[styles.noteItem, { backgroundColor: card }]}
      onPress={() => router.push(`/note/${gist.id}`)}
      activeOpacity={0.8}
    >
      <View style={[styles.accentStripe, { backgroundColor: accentColor }]} />
      <View style={styles.noteBody}>
        <View style={styles.noteHeader}>
          <View style={styles.noteHeaderLeft}>
            {gist.sync_status !== 'synced' ? (
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      gist.sync_status === 'error' ? danger : '#FF9800',
                  },
                ]}
              />
            ) : null}
            <ThemedText style={styles.noteTitle} numberOfLines={1}>
              {gist.title}
            </ThemedText>
          </View>
        </View>
        <View style={styles.noteFooter}>
          <View style={[styles.privacyPill, { backgroundColor: pillBackground }]}>
            <ThemedText style={[styles.privacyText, { color: pillText }]}>
              {privacyLabel}
            </ThemedText>
          </View>
          <ThemedText style={[styles.noteDate, { color: mutedText }]}>
            {new Date(gist.updated_at).toLocaleDateString()}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  noteItem: {
    marginVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  accentStripe: {
    width: 6,
  },
  noteBody: {
    flex: 1,
    padding: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '700',
    flexShrink: 1,
  },
  noteDate: {
    fontSize: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  privacyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  privacyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
