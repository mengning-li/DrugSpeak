import React, { useState, useCallback } from 'react';
import { FlatList, ActivityIndicator, StyleSheet, SafeAreaView, View, Text, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../constant/apiConfig';
import { forceSyncToBackend } from '../redux/learningSlice';

const Community = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  
  // Get user ID for highlighting current user (if logged in)
  const currentUserId = useSelector(state => state.auth.user?.id);
  const token = useSelector(state => state.auth.token);

  // Fetch ranking data
  const fetchRanking = async () => {
    setLoading(true);
    setError(null);
    try {
      // Sync user data to backend first if authenticated
      if (token && currentUserId) {
        await dispatch(forceSyncToBackend()).unwrap();
      }
      
      // Add cache-busting parameter to force fresh data
      const response = await fetch(API_URL + '/study-record?_=' + new Date().getTime());
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      console.log('Fetched ranking data:', data);
      // Make sure we sort by totalScore in descending order
      data.sort((a, b) => b.totalScore - a.totalScore);
      setRanking(data);
    } catch (err) {
      setError('Failed to fetch ranking data.');
      setRanking([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('Community screen is now focused');
      // Fetch immediately when focused
      fetchRanking();
      
      // Clean up function (nothing to do now)
      return () => {
        console.log('Community screen is now unfocused');
      };
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRanking().then(() => setRefreshing(false));
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text>Loading ranking...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item, index }) => {
    const isCurrentUser = currentUserId && currentUserId === item.userId;
    return (
      <View style={[styles.row, isCurrentUser && styles.highlight]}>
        <Text style={styles.cell}>{index + 1}</Text>
        <Text style={styles.cell}>{item.user?.username || '-'}</Text>
        <Text style={styles.cell}>{item.user?.gender || '-'}</Text>
        <Text style={styles.cell}>
          Score: {item.totalScore} {'\n'}
          Learning: {item.currentLearning} {'\n'}
          Finished: {item.finishedLearning}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchRanking}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={ranking}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={renderItem}
        keyExtractor={item => item.userId}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={styles.headerCell}>Rank</Text>
            <Text style={styles.headerCell}>Name</Text>
            <Text style={styles.headerCell}>Gender</Text>
            <Text style={styles.headerCell}>Progress</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No ranking data available.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', backgroundColor: '#eee', padding: 8 },
  headerCell: { flex: 1, fontWeight: 'bold' },
  row: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderColor: '#eee' },
  cell: { flex: 1 },
  highlight: { backgroundColor: '#d0f0ff' },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    marginBottom: 8,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Community;