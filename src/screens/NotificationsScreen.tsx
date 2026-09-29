import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { radii } from '../theme/shape';
import ScreenHeader from '../components/common/ScreenHeader';
import EmptyState from '../components/common/EmptyState';

export default function NotificationsScreen({
  token,
  apiUrl,
  onMarkAsRead,
  onDecrementUnread,
}: {
  token: string | null;
  apiUrl: string;
  onMarkAsRead?: () => void;
  onDecrementUnread?: () => void;
}) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (pageNumber = 1, isRefresh = false) => {
    if (!hasMore && !isRefresh) return;

    if (pageNumber === 1) setIsLoading(true);

    try {
      const res = await fetch(`${apiUrl}/notifications?page=${pageNumber}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        if (isRefresh || pageNumber === 1) {
          setNotifications(data.data);
        } else {
          setNotifications(prev => [...prev, ...data.data]);
        }
        setHasMore(data.next_page_url !== null);
        setPage(pageNumber);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications(1);
    }
  }, [token]);

  const onRefresh = () => {
    setIsRefreshing(true);
    setHasMore(true);
    fetchNotifications(1, true);
  };

  const loadMore = () => {
    if (!isLoading && hasMore && notifications.length > 0) {
      fetchNotifications(page + 1);
    }
  };

  const handleItemPress = async (item: any) => {
    if (Number(item.is_read) === 1) return;

    // Optimistically update UI
    setNotifications(prev =>
      prev.map(n => n.id === item.id ? { ...n, is_read: 1 } : n)
    );
    onDecrementUnread?.();

    try {
      await fetch(`${apiUrl}/notifications/${item.id}/mark-as-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      // revert on failure
      setNotifications(prev =>
        prev.map(n => n.id === item.id ? { ...n, is_read: 0 } : n)
      );
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await fetch(`${apiUrl}/notifications/mark-as-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      onMarkAsRead?.();
    } catch (e) {
      console.error(e);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const hasUnread = notifications.some(n => Number(n.is_read) === 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getIcon = (type: string) => {
    if (type === 'missed_payment') return '⚠️';
    return '🔔';
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notifications" subtitle="Stay updated with alerts" />

      <View style={styles.cardContainer}>
        {/* Mark all as read button */}
        {hasUnread && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={handleMarkAllRead}
            disabled={isMarkingAll}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
          >
            {isMarkingAll
              ? <ActivityIndicator size="small" color={palette.primary} />
              : <Text style={styles.markAllText}>✓ Mark all as read</Text>
            }
          </TouchableOpacity>
        )}

        {isLoading && page === 1 ? (
          <ActivityIndicator size="large" color={palette.primary} style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={<EmptyState title="No Notifications" message="No notifications yet." icon="📭" />}
            ListFooterComponent={
              isLoading && page > 1 ? (
                <ActivityIndicator size="small" color={palette.primary} style={{ padding: 20 }} />
              ) : null
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleItemPress(item)}
                style={[styles.card, Number(item.is_read) === 0 && styles.cardUnread]}
              >
                <View style={[styles.iconContainer, Number(item.is_read) === 0 && styles.iconContainerUnread]}>
                  <Text style={styles.icon}>{getIcon(item.type)}</Text>
                </View>
                <View style={styles.contentContainer}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title}>{item.title}</Text>
                    {Number(item.is_read) === 0 && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.body}>{item.body}</Text>
                  <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.textPrimary },
  cardContainer: {
    flex: 1,
    backgroundColor: palette.background,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: -8,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xl,
    zIndex: 10,
    ...require('../theme/shape').shadowPresets.card,
  },
  markAllBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: `${palette.success}18`,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: `${palette.success}50`,
    minHeight: 32,
    justifyContent: 'center',
  },
  markAllText: {
    color: palette.success,
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cardUnread: {
    backgroundColor: `${palette.success}0D`,
    borderColor: palette.success,
    borderWidth: 1,
  },
  iconContainer: {
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.gray100,
  },
  iconContainerUnread: {
    backgroundColor: `${palette.primary}20`,
  },
  icon: { fontSize: 20 },
  contentContainer: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.success,
    marginLeft: spacing.xs,
  },
  body: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: palette.textMuted,
  },
});
