import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import screens
import DrugCategory from '../Screen/DrugCategory';
import DrugList from '../Screen/DrugList';
import DrugDetail from '../Screen/DrugDetail';
import LearningList from '../Screen/LearningList';
import Learning from '../Screen/Learning';
import Community from '../Screen/Community';
import MyProfile from '../Screen/MyProfile';
import EditProfile from '../Screen/EditProfile';
import SignIn from '../Screen/SignIn';
import SignUp from '../Screen/SignUp';

// Import selectors
import { selectLearningCount, selectIsInFinishedList, selectIsInLearningList, markAsFinished, moveBackToLearning, removeDrug } from '../redux/learningSlice';
import { selectIsAuthenticated } from '../redux/authSlice';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createStackNavigator();

// Auth Stack Navigator for login/signup screens
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="SignInScreen" component={SignIn} />
    <AuthStack.Screen name="SignUpScreen" component={SignUp} />
  </AuthStack.Navigator>
);

// Component to show when authentication is required
const AuthRequiredScreen = ({ navigation, screenName }) => {
  return (
    <View style={styles.authRequiredContainer}>
      <Ionicons name="lock-closed-outline" size={60} color="#ccc" />
      <Text style={styles.authRequiredTitle}>Login Required</Text>
      <Text style={styles.authRequiredText}>
        You need to be logged in to access this feature.
      </Text>
      <TouchableOpacity
        style={styles.authRequiredButton}
        onPress={() => navigation.navigate('Profile')}
      >
        <Text style={styles.authRequiredButtonText}>Sign In or Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
};

// Pre-define stack navigators to avoid inline functions
const DrugStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="DrugCategory" 
      component={DrugCategory}
      options={{ title: 'Drug Categories' }}
    />
    <Stack.Screen 
      name="DrugList" 
      component={DrugList}
      options={({ route }) => ({ title: route.params?.categoryName || 'Drugs' })}
    />
    <Stack.Screen 
      name="DrugDetail" 
      component={DrugDetail}
      options={{ title: 'Drug Details' }}
    />
  </Stack.Navigator>
);

// Learning Stack with auth check
const LearningStack = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigation = useNavigation();
  
  if (!isAuthenticated) {
    return <AuthRequiredScreen navigation={navigation} screenName="Learning" />;
  }
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="LearningList" 
        component={LearningList}
        options={{ title: 'My Learning List' }}
      />
      <Stack.Screen 
        name="LearningDetail" 
        component={Learning}
        options={{ title: 'Learning' }}
      />
      <Stack.Screen 
        name="DrugDetailFromLearning" 
        component={DrugDetail}
        options={{ title: 'Drug Details' }}
      />
    </Stack.Navigator>
  );
};

// Community Stack - accessible without authentication
const CommunityStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Community" 
      component={Community}
      options={{ title: 'Community Ranking' }}
    />
  </Stack.Navigator>
);

// Profile stack with auth routing
const ProfileStack = () => {
  const user = useSelector(selectIsAuthenticated);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <>
          <Stack.Screen 
            name="SignIn" 
            component={SignIn}
            options={{ title: 'Sign In' }}
          />
          <Stack.Screen 
            name="SignUp" 
            component={SignUp}
            options={{ title: 'Sign Up' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen 
            name="MyProfile" 
            component={MyProfile}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfile}
            options={{ title: 'Edit Profile' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

// Main tab navigator
const AppNavigator = () => {
  const user = useSelector(selectIsAuthenticated);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  // FIXED: Safe access to learningCount with proper protection if not authenticated
  const learningCount = useSelector(state => {
    if (!isAuthenticated) return 0;
    return selectLearningCount(state);
  });
  
  // Tab configuration for easy addition of new tabs
  const tabConfig = [
    {
      name: 'Drugs',
      component: DrugStack,
      icons: {
        active: 'medkit',
        inactive: 'medkit-outline'
      },
      badgeSelector: null, 
      options: { headerShown: false }
    },
    {
      name: 'Learning',
      component: LearningStack,
      icons: {
        active: 'book',
        inactive: 'book-outline'
      },
      // Only show badge if authenticated
      badgeSelector: isAuthenticated ? learningCount : null, 
      options: { 
        headerShown: false,
        // Show auth alert if tab is pressed while not authenticated
        tabBarButton: (props) => {
          const navigation = useNavigation();
          const { onPress, ...restProps } = props;
          return (
            <TouchableOpacity
              {...restProps}
              onPress={() => {
                if (!isAuthenticated) {
                  Alert.alert(
                    'Login Required',
                    'You need to be logged in to access your learning list.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Sign In', onPress: () => navigation.navigate('Profile') }
                    ]
                  );
                } else {
                  onPress();
                }
              }}
            />
          );
        }
      }
    },
    {
      name: 'Community',
      component: CommunityStack,
      icons: {
        active: 'people',
        inactive: 'people-outline'
      },
      badgeSelector: null,
      options: { 
        headerShown: false
      }
    },
    {
      name: 'Profile',
      component: ProfileStack,
      icons: {
        active: 'person',
        inactive: 'person-outline'
      },
      badgeSelector: null,
      options: { headerShown: false }
    },
  ];
  
  return (
    <Tab.Navigator
      initialRouteName={isAuthenticated ? 'Drugs' : 'Profile'}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          // Find matching tab configuration
          const tab = tabConfig.find(t => t.name === route.name);
          if (!tab) return null;
          
          // Use appropriate icon based on focus state
          const iconName = focused ? tab.icons.active : tab.icons.inactive;
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      {/* Generate Tab.Screen components from configuration */}
      {tabConfig.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            ...tab.options,
            // Fixed: Only set tabBarBadge if this tab has a badge value and it's > 0
            tabBarBadge: isAuthenticated && tab.badgeSelector && tab.badgeSelector > 0 ? tab.badgeSelector : null
          }}
        />
      ))}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  authRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  authRequiredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  authRequiredText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  authRequiredButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  authRequiredButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  actionButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  finishButton: {
    backgroundColor: '#3498db',
  },
  removeButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppNavigator;