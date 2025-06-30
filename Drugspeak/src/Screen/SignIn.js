import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { loginStart, loginSuccess, loginFailure, clearError } from '../redux/authSlice';
import { selectAuthLoading, selectAuthError } from '../redux/authSlice';
import { API_URL, API_TIMEOUT } from '../constant/apiConfig';

const SignIn = ({ navigation }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const abortControllerRef = useRef(null);

  // Show error alerts from Redux
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSignIn = async () => {
    console.log('Sign In button pressed!');
    
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    dispatch(loginStart());

    try {
      console.log(`Making request to ${API_URL}/auth/login`);
      
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller and store the reference
      abortControllerRef.current = new AbortController();
      
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          console.log('Request timed out after', API_TIMEOUT/1000, 'seconds');
        }
      }, API_TIMEOUT);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
        signal: abortControllerRef.current.signal,
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        dispatch(loginFailure('Server returned an invalid response. Please try again.'));
        Alert.alert('Error', 'Server returned an invalid response. Please try again.');
        return;
      }
      
      if (response.ok) {
        // Success - save token and user data
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        // Update Redux state with auth info
        dispatch(loginSuccess({
          user: data.user,
          token: data.token,
        }));
        
        console.log('Login successful!');
        
        // Navigate to the Drugs tab - this is optional since AppNavigator
        // will automatically switch to the main tabs on auth state change
        if (navigation.canGoBack()) {
          navigation.goBack(); // Return to previous screen if possible
        }
      } else {
        // Provide more specific error messages based on response
        let errorMessage = data.message || 'Invalid credentials';
        
        if (response.status === 401) {
          // Unauthorized - wrong email or password
          if (errorMessage.includes('email')) {
            errorMessage = 'No account found with this email address.';
          } else if (errorMessage.includes('password')) {
            errorMessage = 'Incorrect password. Please try again.';
          } else {
            errorMessage = 'Email or password is incorrect.';
          }
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        dispatch(loginFailure(errorMessage));
        Alert.alert('Sign In Failed', errorMessage);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Better error handling with specific messages
      let errorMessage = 'Network error. Please check your connection.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The server might be down or overloaded.';
      } else if (error.message) {
        if (error.message.includes('Network request failed')) {
          errorMessage = 'Cannot connect to server. Please check your internet connection.';
        } else if (error.message.includes('JSON')) {
          errorMessage = 'Received invalid response from server. Please try again later.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      dispatch(loginFailure(errorMessage));
      Alert.alert('Error', errorMessage);
    }
  };

  const handleClear = () => {
    setEmail('');
    setPassword('');
    dispatch(clearError());
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Sign in with your email and password</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                autoComplete="off"
                textContentType="none"
                autoCorrect={false}
                autoCapitalize="none"
                importantForAutofill="no"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                activeOpacity={0.7} // Added for better touch feedback
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClear}
              activeOpacity={0.7} // Added for better touch feedback
              disabled={loading}
            >
              <Ionicons name="close-circle-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.signInButton]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.7} // Added for better touch feedback
            >
              <Ionicons name="log-in-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.switchContainer}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.7} // Added for better touch feedback
          >
            <Text style={styles.switchText}>
              Don't have an account? Sign up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    paddingRight: 50,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 8, // Increased touch area
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
    minHeight: 48, // Added explicit height
  },
  clearButton: {
    backgroundColor: '#e0e0e0',
  },
  signInButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  switchContainer: {
    alignItems: 'center',
    padding: 10, // Increased touch area
  },
  switchText: {
    color: '#3498db',
    fontSize: 16,
  },
});

export default SignIn;