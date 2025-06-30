import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { selectIsAuthenticated, selectUser, logout } from './src/redux/authSlice';
import { fetchLearningLists, forceSyncToBackend } from './src/redux/learningSlice';

// Keep splash screen up
SplashScreen.preventAutoHideAsync();

// App content that uses Redux
const AppContent = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectUser);
  const [isLoading, setIsLoading] = useState(true);

  // Debug: Log drugScore state when it changes
  const drugScores = useSelector(state => state.drugScore.scores);
  useEffect(() => {
    console.log('=== App: drugScores state changed ===');
    console.log('drugScores:', drugScores);
    console.log('drugScores keys:', Object.keys(drugScores || {}));
    console.log('drugScores values:', Object.values(drugScores || {}));
  }, [drugScores]);

  // Initial app loading - simplified
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Just a short delay for splash screen
        await new Promise(resolve => setTimeout(resolve, 1000));

        // If user is already authenticated from persistent storage, sync data
        if (isAuthenticated && user && user.id) {
          console.log("Syncing data on app startup");
          await dispatch(forceSyncToBackend()).unwrap();
        }
      } catch (error) {
        console.error('Error during app initialization:', error);
      } finally {
        setIsLoading(false);
        await SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, [isAuthenticated, user, dispatch]);

  // Track authentication changes to reload user data
  useEffect(() => {
    if (isAuthenticated && user && user.id) {
      console.log("User authenticated, fetching their learning data");
      dispatch(fetchLearningLists(user.id));
    }
  }, [isAuthenticated, user, dispatch]);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      console.log('Redux state updated:', {
        isAuthenticated: state.auth.isAuthenticated,
        user: state.auth.user ? state.auth.user.username : null,
        drugScores: Object.keys(state.drugScore.scores).length,
        learningCount: state.learning.learningList.length
      });
    });
    
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      // First dispatch Redux logout (this will clear Redux state)
      dispatch(logout());
      
      // Then purge the persisted state (this will remove from AsyncStorage)
      persistor.purge();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return null;
  }

  return <AppNavigator />;
};

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={null} 
        persistor={persistor}
        onBeforeLift={() => {
          console.log("Redux state about to be rehydrated");
        }}
      >
        <NavigationContainer>
      <AppContent />
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
}