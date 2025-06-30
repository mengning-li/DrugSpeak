import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import DrugPronunciation from '../Component/DrugPronunciation';
import { selectDrugById } from '../redux/drugSlice';
import { addToLearningList, selectIsInLearningList, selectIsInFinishedList, markAsFinished, moveBackToLearning, removeDrug } from '../redux/learningSlice';
import { selectDrugCategories } from '../redux/drugSlice';
import { useNavigation } from '@react-navigation/native';
import { selectIsAuthenticated } from '../redux/authSlice';

export default function DrugDetail({ route }) {
  // Get drugId from navigation params
  const { drugId } = route.params || {};
  const dispatch = useDispatch();
  const navigation = useNavigation();
  
  console.log("DrugDetail - Route params:", route.params);
  console.log("DrugDetail - Drug ID:", drugId);
  
  // Redux selectors to get drug data and status
  const drug = useSelector(state => selectDrugById(state, drugId));
  const drugCategories = useSelector(selectDrugCategories);
  const isInLearningList = useSelector(state => selectIsInLearningList(state, drugId));
  const isInFinishedList = useSelector(state => selectIsInFinishedList(state, drugId));
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  useEffect(() => {
    console.log("DrugDetail - Drug data from Redux:", drug);
    console.log("DrugDetail - Categories data:", drugCategories);
  }, [drug, drugCategories]);

  // Add drug to learning list
  const handleAddToLearningList = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to study and add drugs to your learning list.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Profile') }
        ]
      );
      return;
    }
    if (!drug) {
      Alert.alert('Error', 'Cannot add to learning list: Drug data not available.');
      return;
    }
    dispatch(addToLearningList(drugId))
      .unwrap()
      .then(() => {
        Alert.alert("Added to Learning List", `${drug.name} has been added.`);
      })
      .catch((error) => {
        Alert.alert('Error', 'Failed to add drug to learning list.');
        console.error('Error adding to learning list:', error);
      });
  };


  // Show error if drug data is not available
  if (!drug || !drugCategories) {
    console.error("DrugDetail - Missing data:", { 
      hasDrug: !!drug, 
      hasCategories: !!drugCategories
    });
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.error}>Drug details not available. Please check the data source.</Text>
        <Text style={styles.errorDetail}>Drug ID: {drugId}</Text>
        <Text style={styles.errorDetail}>Has Drug Data: {drug ? 'Yes' : 'No'}</Text>
        <Text style={styles.errorDetail}>Has Categories: {drugCategories ? 'Yes' : 'No'}</Text>
      </View>
    );
  }

  const categoryNames = drug.categories?.map(catId => drugCategories[catId]?.name || 'Unknown') || [];
  
  console.log("DrugDetail - Rendering with drug name:", drug.name);

  return (
    <ScrollView style={styles.container}>
      {/* Header section with drug name and details */}
      <View style={styles.header}>
        <Text style={styles.drugName}>{drug.name}</Text>
        <Text style={styles.formula}>({drug.molecular_formula})</Text>
        <Text style={styles.categories}>Categories: {categoryNames.join(', ')}</Text>
        <Text style={styles.description}>{drug.desc}</Text>
      </View>

      {/* Pronunciation component */}
      <View style={styles.pronunciationWrapper}>
        <DrugPronunciation drugName={drug.name} />
      </View>

      {/* Study button (only shown if not in learning or finished list) */}
      {!isInLearningList && !isInFinishedList && (
        <TouchableOpacity style={styles.studyButton} onPress={handleAddToLearningList}>
          <Text style={styles.studyButtonText}>STUDY</Text>
        </TouchableOpacity>
      )}

      
      {/* Finished learning indicator */}
      {/* {isInFinishedList && (
        <View style={styles.inListIndicator}>
          <IconButton
            iconName="checkmark-done-outline"
            iconSize={20}
            iconColor="#4CAF50"
            title="Finished Learning"
            textStyle={styles.finishedText}
            style={styles.finishedButton}
          />
        </View>
      )} */}
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
  drugName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  formula: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  categories: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
  },
  pronunciationWrapper: {
    marginTop: 20,
    marginBottom: 20,
  },
  studyButton: {
    backgroundColor: '#3498db',
    padding: 15,
    margin: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  studyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inListIndicator: {
    margin: 20,
    alignItems: 'center',
  },
  inListButton: {
    backgroundColor: '#e8f4fd',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#bde0fd',
  },
  inListText: {
    color: '#3498db',
    fontWeight: '500',
    fontSize: 16,
  },
  finishedButton: {
    backgroundColor: '#e8f5e9',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  finishedText: {
    color: '#4CAF50',
    fontWeight: '500',
    fontSize: 16,
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
    marginBottom: 15,
  },
  errorDetail: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  debugText: {
    color: '#333',
    fontSize: 14,
    fontWeight: 'bold',
    padding: 5,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  finishButton: {
    backgroundColor: '#4CAF50',
  },
  removeButton: {
    backgroundColor: '#d32f2f',
  },
});