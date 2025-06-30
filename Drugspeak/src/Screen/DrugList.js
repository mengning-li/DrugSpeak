import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { drugData, drugCategory } from '../resources/resource';

export default function DrugListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryId } = route.params || {};
  const [drugs, setDrugs] = useState([]);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (!categoryId) {
      console.error('No category ID provided');
      return;
    }

    // Get category name
    if (drugCategory && drugCategory[categoryId]) {
      setCategoryName(drugCategory[categoryId].name);
    }

    // Filter drugs that belong to the selected category
    if (drugData && Array.isArray(drugData)) {
      const filteredDrugs = drugData.filter(drug => 
        drug.categories && drug.categories.includes(categoryId)
      );
      setDrugs(filteredDrugs);
    } else {
      console.error('Drug data is not available or not in expected format');
      setDrugs([]);
    }
  }, [categoryId]);

  const goToDrugDetail = (drug) => {
    navigation.navigate('DrugDetail', { drugId: drug.id });
  };

  // Function to render drug aliases/other names
  const renderOtherNames = (otherNames) => {
    if (!otherNames || otherNames.length === 0) return null;
    return (
      <Text style={styles.otherNames}>
        Also known as: {otherNames.join(', ')}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{categoryName || 'Drugs'}</Text>
        {/* <Text style={styles.drugCount}>{drugs.length} drug{drugs.length !== 1 ? 's' : ''}</Text> */}
      </View>

      {drugs.length > 0 ? (
        <FlatList
          data={drugs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.drugItem}
              onPress={() => goToDrugDetail(item)}
            >
              <View style={styles.drugInfo}>
                <Text style={styles.drugName}>{item.name}</Text>
              </View>
              
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No drugs found in this category
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    // backgroundColor: '#fff',
    padding: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    justifyContent: 'center'
  },
  // drugCount: {
  //   fontSize: 14,
  //   color: '#666',
  //   marginTop: 4,
  // },
  listContent: {
    padding: 12,
  },
  drugItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    flexDirection: 'row',
  },
  drugInfo: {
    flex: 1,
  },
  drugName: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  otherNames: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  drugDesc: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  formula: {
    fontSize: 14,
    color: '#0066cc',
    marginTop: 8,
  },
  soundIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  soundIcon: {
    width: 24,
    height: 24,
    tintColor: '#4CAF50',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});