import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { drugData, drugCategory } from '../resources/resource';

export default function DrugCategory() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);

  // Count how many drugs belong to a category
  const countDrugsInCategory = (categoryId) => {
    return drugData.filter((drug) => drug.categories.includes(categoryId)).length;
  };

  useEffect(() => {
    if (drugCategory) {
      const categoriesArray = Object.values(drugCategory).map((category) => ({
        ...category,
        count: countDrugsInCategory(category.id),
      }));

      setCategories(categoriesArray);
    } else {
      console.error('drugCategory is undefined');
      setCategories([]);
    }
  }, []);

  return (
    <View style={styles.container}>
      {categories.length > 0 ? (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.category}
              onPress={() => navigation.navigate('DrugList', { categoryId: item.id })}
            >
              <Text style={styles.categoryName}>
                {item.name} ({item.count})
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text style={styles.noData}>No categories available</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#5f9ea0',
    padding: 12,
  },
  category: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  noData: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#666',
  },
});
