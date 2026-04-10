import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SectionList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchQueues, fetchUserQueues, joinQueue, leaveQueue } from '../store/slices/queueSlice';
import { Queue, MainStackParamList } from '../types';
import QueueCard from '../components/QueueCard';
import WaitTimeIndicator from '../components/WaitTimeIndicator';

type QueueNavProp = NativeStackNavigationProp<MainStackParamList>;

const ACTIVE_VENUE_ID = 'venue-001'; // Will come from context in production

const QueueScreen: React.FC = () => {
  const navigation = useNavigation<QueueNavProp>();
  const dispatch = useAppDispatch();
  const { availableQueues, activeQueues, userPositions, isLoading, isJoining, isLeaving } =
    useAppSelector((state) => state.queue);
  const [activeTab, setActiveTab] = useState<'available' | 'mine'>('available');

  useEffect(() => {
    dispatch(fetchQueues(ACTIVE_VENUE_ID));
    dispatch(fetchUserQueues());
  }, [dispatch]);

  const onRefresh = () => {
    dispatch(fetchQueues(ACTIVE_VENUE_ID));
    dispatch(fetchUserQueues());
  };

  const handleJoin = (queue: Queue) => {
    const alreadyIn = userPositions.some((p) => p.queueId === queue.id);
    if (alreadyIn) {
      Alert.alert('Already in queue', 'You are already in this queue.');
      return;
    }
    Alert.alert(
      `Join ${queue.name}?`,
      `Estimated wait: ${queue.estimatedWaitMinutes} min\nCurrent length: ${queue.currentLength} people`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            const result = await dispatch(joinQueue(queue.id));
            if (joinQueue.fulfilled.match(result)) {
              Alert.alert('Joined!', `You are now in the queue. Position: ${result.payload.position}`);
            }
          },
        },
      ]
    );
  };

  const handleLeave = (queueId: string, queueName: string) => {
    Alert.alert(
      'Leave Queue?',
      `Are you sure you want to leave "${queueName}"? You will lose your position.`,
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => dispatch(leaveQueue(queueId)),
        },
      ]
    );
  };

  const renderAvailableQueue = ({ item }: { item: Queue }) => {
    const myPosition = userPositions.find((p) => p.queueId === item.id);
    return (
      <View style={styles.queueItem}>
        <QueueCard
          queue={item}
          onPress={() => navigation.navigate('QueueDetail', { queueId: item.id })}
          myPosition={myPosition}
        />
        {!myPosition ? (
          <TouchableOpacity
            style={[styles.joinBtn, item.status !== 'active' && styles.joinBtnDisabled]}
            onPress={() => handleJoin(item)}
            disabled={item.status !== 'active' || isJoining}
          >
            {isJoining ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.joinBtnText}>
                {item.status === 'active' ? 'Join Queue' : item.status.toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.leaveBtn}
            onPress={() => handleLeave(item.id, item.name)}
            disabled={isLeaving}
          >
            <Text style={styles.leaveBtnText}>Leave Queue</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMyQueue = ({ item }: { item: Queue }) => {
    const pos = userPositions.find((p) => p.queueId === item.id);
    return (
      <View style={styles.myQueueCard}>
        <View style={styles.myQueueHeader}>
          <Text style={styles.myQueueName}>{item.name}</Text>
          <TouchableOpacity onPress={() => handleLeave(item.id, item.name)}>
            <Text style={styles.myQueueLeave}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.myQueueStats}>
          <View style={styles.myQueueStat}>
            <Text style={styles.myQueueStatValue}>#{pos?.position ?? '—'}</Text>
            <Text style={styles.myQueueStatLabel}>Position</Text>
          </View>
          <View style={styles.myQueueDivider} />
          <View style={styles.myQueueStat}>
            <WaitTimeIndicator minutes={pos?.estimatedWaitMinutes ?? 0} />
            <Text style={styles.myQueueStatLabel}>Wait Time</Text>
          </View>
          <View style={styles.myQueueDivider} />
          <View style={styles.myQueueStat}>
            <Text style={styles.myQueueStatValue}>{item.currentLength}</Text>
            <Text style={styles.myQueueStatLabel}>In Queue</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Queues</Text>
      </View>

      {/* Tab selector */}
      <View style={styles.tabs}>
        {(['available', 'mine'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'available' ? 'Available' : `My Queues (${activeQueues.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && availableQueues.length === 0 ? (
        <ActivityIndicator size="large" color="#1a237e" style={styles.loader} />
      ) : activeTab === 'available' ? (
        <FlatList
          data={availableQueues}
          keyExtractor={(item) => item.id}
          renderItem={renderAvailableQueue}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>⏳</Text>
              <Text style={styles.emptyText}>No queues available right now.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={activeQueues}
          keyExtractor={(item) => item.id}
          renderItem={renderMyQueue}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎟️</Text>
              <Text style={styles.emptyText}>You haven&apos;t joined any queues yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    backgroundColor: '#1a237e',
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#fff' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#1a237e' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  tabTextActive: { color: '#1a237e', fontWeight: '700' },
  listContent: { padding: 16, gap: 12, paddingBottom: 40 },
  loader: { marginTop: 60 },
  queueItem: { gap: 8 },
  joinBtn: {
    backgroundColor: '#1a237e',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinBtnDisabled: { backgroundColor: '#9ca3af' },
  joinBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  leaveBtn: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  leaveBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
  myQueueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  myQueueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  myQueueName: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  myQueueLeave: { fontSize: 18, color: '#9ca3af', paddingLeft: 12 },
  myQueueStats: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  myQueueStat: { alignItems: 'center', flex: 1 },
  myQueueStatValue: { fontSize: 22, fontWeight: '700', color: '#1a237e' },
  myQueueStatLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  myQueueDivider: { width: 1, height: 40, backgroundColor: '#e5e7eb' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#9ca3af', textAlign: 'center' },
});

export default QueueScreen;
