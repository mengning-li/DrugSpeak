import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  signupStart,
  signupSuccess,
  signupFailure,
  clearError,
  selectAuthLoading,
} from '../redux/authSlice';
import { createInitialStudyRecord } from '../Component/studyRecordSync';
import { API_URL, API_TIMEOUT } from '../constant/apiConfig';

const SignUp = ({ navigation }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectAuthLoading);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    gender: 'male',
  });
  const [showPassword, setShowPassword] = useState(false);
  const abortControllerRef = useRef(null);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCancelSignUp = () => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset loading state
    dispatch(signupFailure('Sign up cancelled'));
    console.log('Sign up cancelled by user');
  };

  const handleSignUp = async () => {
    const { username, email, password } = formData;
    
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    dispatch(signupStart());

    try {
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

      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          gender: formData.gender.toLowerCase(),
        }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);
      console.log('Response status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        dispatch(signupFailure('Server returned an invalid response. Please try again.'));
        Alert.alert('Error', 'Server returned an invalid response. Please try again.');
        return;
      }

      if (response.status === 201) {
        // Success - save token and user data
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        // Create initial study record so user appears in ranking
        await createInitialStudyRecord(data.user.id, data.token);
        
        dispatch(signupSuccess({
          user: data.user,
          token: data.token,
        }));
        
        Alert.alert('Success', 'Account created successfully!');
      } else if (response.status === 409) {
        // Explicit conflict response from server
        dispatch(signupFailure('Email already exists'));
        Alert.alert('Email Already Registered', 'This email address is already registered. Please use a different email or try signing in.');
      } else if (response.status === 500 && data.message && (
        data.message.includes('SQLITE_CONSTRAINT') || 
        data.message.includes('duplicate') || 
        data.message.includes('already in use')
      )) {
        // Handle 500 errors that are actually duplicate email errors
        dispatch(signupFailure('Email already exists'));
        Alert.alert('Email Already Registered', 'This email address is already registered. Please use a different email or try signing in.');
      } else {
        // Handle other errors
        let errorMessage = data.message || 'Sign up failed';
        // Try to provide more helpful message
        if (errorMessage.includes('Internal server error')) {
          errorMessage = 'Server error occurred. The email may already be registered.';
        }
        dispatch(signupFailure(errorMessage));
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Signup error:', error);
      
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
      
      dispatch(signupFailure(errorMessage));
      Alert.alert('Error', errorMessage);
    }
  };

  const handleClear = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      gender: 'male',
    });
    dispatch(clearError());
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Sign up a new user</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>User Name</Text>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(text) => updateField('username', text)}
              placeholder="Enter your name"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'male' && styles.genderButtonActive,
                ]}
                onPress={() => updateField('gender', 'male')}
              >
                <Text
                  style={[
                    styles.genderText,
                    formData.gender === 'male' && styles.genderTextActive,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  formData.gender === 'female' && styles.genderButtonActive,
                ]}
                onPress={() => updateField('gender', 'female')}
              >
                <Text
                  style={[
                    styles.genderText,
                    formData.gender === 'female' && styles.genderTextActive,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
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
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
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
              disabled={loading}
            >
              <Ionicons name="close-circle-outline" size={24} color="#666" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>

            {loading ? (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelSignUp}
              >
                <Ionicons name="stop-circle-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.signUpButton]}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Ionicons name="person-add-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>
                  {loading ? 'Creating...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.switchContainer}
            onPress={() => navigation.navigate('SignIn')}
          >
            <Text style={styles.switchText}>
              Switch to: sign in with an existing user
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
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  genderText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#fff',
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
    padding: 8,
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
    minHeight: 48,
  },
  clearButton: {
    backgroundColor: '#e0e0e0',
  },
  signUpButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  switchContainer: {
    alignItems: 'center',
    padding: 10,
  },
  switchText: {
    color: '#3498db',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
});

export default SignUp;