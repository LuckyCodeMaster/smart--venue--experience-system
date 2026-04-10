import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';

const BACKEND_URL = 'https://sves-backend.onrender.com';

// Demo data (offline fallback)
const DEMO = {
  venue: {
    name: 'Grand Arena',
    capacity: 5000,
    currentOccupancy: 2347,
    sections: [
      { id: 'A', name: 'Main Stage', capacity: 1500, occupancy: 892, color: '#ef4444' },
      { id: 'B', name: 'Food Court', capacity: 800, occupancy: 634, color: '#f97316' },
      { id: 'C', name: 'Exhibition', capacity: 1200, occupancy: 421, color: '#22c55e' },
    ],
  },
  queues: [
    { id: 1, name: 'Main Stage Entry', waitTime: 8, length: 34, maxLength: 100 },
    { id: 2, name: 'Food Court', waitTime: 12, length: 56, maxLength: 80 },
    { id: 3, name: 'VIP Check-in', waitTime: 3, length: 8, maxLength: 30 },
  ],
};

export default function App() {
  const [tab, setTab] = useState('attendee');
  const [venue, setVenue] = useState(DEMO.venue);
  const [queues, setQueues] = useState(DEMO.queues);
  const [joinedId, setJoinedId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`${BACKEND_URL.replace(/^http/, 'ws')}/ws`);
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.venue) setVenue(d.venue);
      if (d.queues) setQueues(d.queues);
    };
    return () => ws.close();
  }, []);

  const joinQueue = async (id) => {
    setLoading(true);
    try {
      await fetch(`${BACKEND_URL}/api/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId: id }),
      });
      setJoinedId(id);
    } catch {
      setJoinedId(id); // demo mode
    }
    setLoading(false);
  };

  const pct = Math.round((venue.currentOccupancy / venue.capacity) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏟️ Smart Venue</Text>
        <View style={styles.tabs}>
          {['attendee', 'staff'].map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'attendee' ? '🎟️' : '🛡️'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Venue card */}
        <View style={styles.venueCard}>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueOccupancy}>
            {venue.currentOccupancy.toLocaleString()} / {venue.capacity.toLocaleString()} visitors
          </Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressBar, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.pctText}>{pct}% capacity</Text>
        </View>

        {/* Sections */}
        <Text style={styles.sectionTitle}>🗺️ Crowd Density</Text>
        {venue.sections.map(s => {
          const sp = Math.round((s.occupancy / s.capacity) * 100);
          return (
            <View key={s.id} style={[styles.sectionCard, { borderLeftColor: s.color }]}>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionName}>{s.name}</Text>
                <Text style={styles.sectionPct}>{sp}%</Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressBar, { width: `${sp}%`, backgroundColor: s.color }]} />
              </View>
            </View>
          );
        })}

        {/* Queues */}
        <Text style={styles.sectionTitle}>🕐 Virtual Queues</Text>
        {queues.map(q => (
          <View key={q.id} style={styles.queueCard}>
            <View style={styles.queueRow}>
              <Text style={styles.queueName}>{q.name}</Text>
              <Text style={styles.queueWait}>{q.waitTime}m wait</Text>
            </View>
            {joinedId === q.id ? (
              <View style={styles.joinedBadge}>
                <Text style={styles.joinedText}>✅ You're in queue • #{q.length}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.joinBtn, joinedId && styles.joinBtnDisabled]}
                onPress={() => !joinedId && joinQueue(q.id)}
                disabled={!!joinedId || loading}
              >
                <Text style={styles.joinBtnText}>
                  {loading ? 'Joining...' : 'Join Queue'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  tabs: { flexDirection: 'row', gap: 4 },
  tab: { padding: 8, borderRadius: 12, backgroundColor: '#f3f4f6' },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { fontSize: 18 },
  tabTextActive: { color: '#fff' },
  content: { padding: 16, gap: 12 },
  venueCard: { backgroundColor: '#2563eb', borderRadius: 16, padding: 16, marginBottom: 4 },
  venueName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  venueOccupancy: { fontSize: 13, color: '#bfdbfe', marginTop: 4 },
  progressBg: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 9999, height: 8, marginTop: 12, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#fff', borderRadius: 9999 },
  pctText: { fontSize: 12, color: '#bfdbfe', marginTop: 4, textAlign: 'right' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginTop: 8 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sectionName: { fontSize: 14, fontWeight: '600', color: '#374151' },
  sectionPct: { fontSize: 13, color: '#6b7280' },
  queueCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  queueRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  queueName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  queueWait: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  joinBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  joinBtnDisabled: { backgroundColor: '#93c5fd' },
  joinBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  joinedBadge: { backgroundColor: '#eff6ff', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  joinedText: { color: '#2563eb', fontWeight: '600', fontSize: 14 },
});
