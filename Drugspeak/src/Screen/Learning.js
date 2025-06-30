import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import DrugPronunciation from '../Component/DrugPronunciation';
import { selectDrugById } from '../redux/drugSlice';
import { 
  markAsFinished, 
  removeDrug, 
  selectIsInFinishedList, 
  selectIsInLearningList, 
  moveBackToLearning 
} from '../redux/learningSlice';
import RecordingHandle from '../Component/RecordingHandle';
import { updateScoreSuccess } from '../redux/drugScoreSlice';
import { syncStudyRecord, calculateStudyData } from '../Component/studyRecordSync';

export default function Learning({ route, navigation }) {
  const { drugId } = route.params || {};
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const token = useSelector(state => state.auth.token);
  const drug = useSelector(state => selectDrugById(state, drugId));
  const isInFinishedList = useSelector(state => selectIsInFinishedList(state, drugId));
  const isInLearningList = useSelector(state => selectIsInLearningList(state, drugId));
  
  // Get current study data for syncing
  const drugScores = useSelector(state => state.drugScore.scores || {});
  const learningList = useSelector(state => state.learning.learningList || []);
  const finishedList = useSelector(state => state.learning.finishedList || []);
  
  // Get the score for this specific drug
  const drugScore = useSelector(state => state.drugScore.scores?.[drugId]);
  
  // Sync function to update backend
  const syncToBackend = async (customScores = null) => {
    if (!user?.id || !token) {
      console.log('⚠️ Cannot sync - user not authenticated');
      return true;
    }
    
    const scoresToUse = customScores || drugScores;
    const studyData = calculateStudyData(scoresToUse, learningList, finishedList);
    
    try {
      return await syncStudyRecord(user.id, token, studyData);
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  };
  
  const handleFinishOrReview = async () => {
    try {
      if (isInFinishedList) {
        // Move back to learning - use the correct action
        const result = await dispatch(moveBackToLearning({
          drugId,
          userId: user?.id
        })).unwrap();
        
        console.log('Move to learning result:', result);
        
        // Sync to backend after state update
        setTimeout(async () => {
          const syncSuccess = await syncToBackend();
          console.log('Sync after move to learning:', syncSuccess);
        }, 500); // Small delay to ensure Redux state is updated
        
        Alert.alert('Moved to Learning', `${drug.name} is back in your learning list.`);
        navigation.goBack();
        
      } else {
        // Mark as finished
        const result = await dispatch(markAsFinished({
          drugId,
          userId: user?.id
        })).unwrap();
        
        console.log('Mark as finished result:', result);
        
        // Sync to backend after state update
        setTimeout(async () => {
          const syncSuccess = await syncToBackend();
          console.log('Sync after mark as finished:', syncSuccess);
        }, 500); // Small delay to ensure Redux state is updated
        
        Alert.alert('Marked as Finished', `${drug.name} is now in your finished list.`);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error in handleFinishOrReview:', error);
      Alert.alert('Error', `Failed to ${isInFinishedList ? 'move back to learning' : 'mark as finished'}.`);
    }
  };
  
  const handleRemove = () => {
    Alert.alert(
      'Remove Drug',
      `Are you sure you want to remove ${drug.name} from your ${isInFinishedList ? 'finished' : 'learning'} list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const result = await dispatch(removeDrug({ 
                drugId, 
                fromFinished: isInFinishedList,
                userId: user?.id
              })).unwrap();
              
              console.log('Remove drug result:', result);
              
              // Sync to backend after state update
              setTimeout(async () => {
                const syncSuccess = await syncToBackend();
                console.log('Sync after remove:', syncSuccess);
              }, 500); // Small delay to ensure Redux state is updated
              
              Alert.alert('Removed', `${drug.name} has been removed.`);
              navigation.goBack();
              
            } catch (error) {
              console.error('Error removing drug:', error);
              Alert.alert('Error', 'Failed to remove drug.');
            }
          }
        }
      ]
    );
  };
  
  if (!drug) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.error}>Drug details not available. Please check the data source.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.drugName}>{drug.name}</Text>
          {drugScore ? (
            <Text style={styles.scoreText}>Score: {drugScore}</Text>
          ) : null}
        </View>
        <Text style={styles.formula}>({drug.molecular_formula})</Text>
        <Text style={styles.description}>{drug.desc}</Text>
      </View>

      <View style={styles.pronunciationWrapper}>
        <DrugPronunciation drugName={drug.name} />
      </View>
      
      <View style={styles.recordContainer}>
        <RecordingHandle 
          drugName={drug.name}
          onScoreUpdate={async (score) => {
            console.log('Score update received:', score);
            
            // Check if score should be updated based on your logic
            const shouldUpdate = !drugScores[drugId] || score > drugScores[drugId];
            
            if (shouldUpdate) {
              // First dispatch the update (only updates if score is higher)
              dispatch(updateScoreSuccess({ drugId, score }));
              
              // Create updated scores object for immediate sync
              const updatedScores = { 
                ...drugScores, 
                [drugId]: score 
              };
              
              console.log('✅ Score updated, syncing to backend...');
              
              // Sync the updated data to the backend immediately
              if (user?.id && token) {
                setTimeout(async () => {
                  try {
                    const syncSuccess = await syncToBackend(updatedScores);
                    console.log('Score sync result:', syncSuccess);
                    
                    if (syncSuccess) {
                      console.log('✅ Score synced successfully to backend!');
                    }
                  } catch (error) {
                    console.error('Score sync error:', error);
                  }
                }, 100);
              }
            } else {
              console.log('⚠️ Score not updated - not higher than existing score');
            }
          }} 
        />
      </View>
      
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.finishButton]} 
          onPress={handleFinishOrReview}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>
            {isInFinishedList ? 'Review' : 'Finish'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.removeButton]} 
          onPress={handleRemove}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  drugName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formula: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
  pronunciationWrapper: {
    marginTop: 20,
    marginBottom: 10,
  },
  recordContainer: {
    marginTop: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
  },
  finishButton: {
    backgroundColor: '#4CAF50',
  },
  removeButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  error: {
    color: '#d32f2f',
    fontSize: 18,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});