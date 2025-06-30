import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import IconButton from '../Component/IconButton';
import { fetchLearningLists, markAsFinished, moveBackToLearning, removeDrug, selectLearningList, selectFinishedList } from '../redux/learningSlice';
import { selectAllDrugs } from '../redux/drugSlice';

export default function LearningList({ navigation }) {
  const dispatch = useDispatch();
  const learningIds = useSelector(selectLearningList);
  const finishedIds = useSelector(selectFinishedList);
  const allDrugs = useSelector(selectAllDrugs);
  const user = useSelector(state => state.auth.user);
  const drugScores = useSelector(state => state.drugScore);
  
  const [currentExpanded, setCurrentExpanded] = useState(true);
  const [finishedExpanded, setFinishedExpanded] = useState(false);
  
  useEffect(() => {
    if (user && user.id) {
      dispatch(fetchLearningLists(user.id));
      
      const unsubscribe = navigation.addListener('focus', () => {
        if (user && user.id) {
          dispatch(fetchLearningLists(user.id));
        }
      });
      
      return unsubscribe;
    }
  }, [dispatch, navigation, user]);
  
  const learningItems = learningIds.map(id => {
    const drug = allDrugs.find(drug => drug.id === id) || { id, name: 'Unknown Drug' };
    // Add score to the drug object
    return {
      ...drug,
      score: drugScores[id] || null
    };
  });
  
  const finishedItems = finishedIds.map(id => {
    const drug = allDrugs.find(drug => drug.id === id) || { id, name: 'Unknown Drug' };
    // Add score to the drug object
    return {
      ...drug,
      score: drugScores[id] || null
    };
  });
  
  const navigateToDrugDetail = (drugId) => {
    navigation.navigate('DrugDetailFromLearning', { drugId });
  };
  
  const navigateToLearningScreen = (drugId) => {
    navigation.navigate('LearningDetail', { drugId });
  };
  
  // Handle expanding/collapsing sections
  const toggleCurrentExpanded = () => {
    setCurrentExpanded(!currentExpanded);
  };
  
  const toggleFinishedExpanded = () => {
    setFinishedExpanded(!finishedExpanded);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity 
            style={styles.sectionTitleContainer}
            onPress={toggleCurrentExpanded}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>
              Current Learning ({learningItems.length})
            </Text>
          </TouchableOpacity>
          
          <IconButton
            iconName={currentExpanded ? "remove-outline" : "add-outline"}
            iconSize={30}
            iconColor="#333"
            style={styles.expandButton}
            onPress={toggleCurrentExpanded}
          />
        </View>
        
        {currentExpanded && (
          <View style={styles.sectionContent}>
            {learningItems.length > 0 ? (
              learningItems.map((item) => {
                const itemKey = `learning-${item.id || Math.random().toString(36).substr(2, 9)}`;
                return (
                  <TouchableOpacity 
                    key={itemKey}
                    style={styles.drugItem}
                    onPress={() => navigation.navigate('LearningDetail', { drugId: item.id })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.drugNameContainer}>
                      <Text style={styles.drugName}>{item.name}</Text>
                      {item.score && <Text style={styles.scoreText}>Score: {item.score}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.emptyMessage}>No drugs in learning list.</Text>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity 
            style={styles.sectionTitleContainer}
            onPress={toggleFinishedExpanded}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>
              Finished ({finishedItems.length})
            </Text>
          </TouchableOpacity>
          
          <IconButton
            iconName={finishedExpanded ? "remove-outline" : "add-outline"}
            iconSize={30}
            iconColor="#333"
            style={styles.expandButton}
            onPress={toggleFinishedExpanded}
          />
        </View>
        
        {finishedExpanded && (
          <View style={styles.sectionContent}>
            {finishedItems.length > 0 ? (
              finishedItems.map((item) => {
                const itemKey = `finished-${item.id || Math.random().toString(36).substr(2, 9)}`;
                return (
                  <TouchableOpacity 
                    key={itemKey}
                    style={styles.drugItem}
                    onPress={() => navigation.navigate('LearningDetail', { drugId: item.id })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.drugNameContainer}>
                      <Text style={styles.drugName}>{item.name}</Text>
                      {item.score && <Text style={styles.scoreText}>Score: {item.score}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.emptyMessage}>No finished drugs yet.</Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  sectionContainer: {
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#e0e0e0',
  },
  sectionTitleContainer: {
    flex: 1,
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expandButton: {
    padding: 10,
    backgroundColor: 'transparent',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContent: {
    backgroundColor: '#fff',
  },
  drugItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  drugNameContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drugName: {
    fontSize: 16,
  },
  scoreText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    backgroundColor: 'transparent',
  },
  emptyMessage: {
    padding: 20,
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
  },
});