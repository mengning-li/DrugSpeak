# DrugSpeak

DrugSpeak is a mobile application designed to help users learn and practice drug pronunciations. It features a React Native frontend and a NestJS backend, providing a comprehensive learning experience with real-time synchronization and user authentication.

## Features

- **User Authentication**: Secure login and registration using JWT.
- **Drug Pronunciation**: Listen to and practice drug names with audio playback.
- **Learning Progress Tracking**: Track your learning progress and scores.
- **Community Rankings**: Compare your progress with others.
- **Offline Support**: Work offline with automatic data synchronization when reconnected.

## Project Structure

- **Frontend**: React Native app using Redux for state management.
- **Backend**: NestJS server with SQLite database.
- **API Documentation**: Swagger UI available at `/api-doc`.

## Setup Instructions

### Prerequisites

- Node.js and npm installed
- Expo CLI installed globally (`npm install -g expo-cli`)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd DrugSpeak/drug-speak-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run start:dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd DrugSpeak
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npm start
   ```
4. Follow the instructions in the terminal to run the app on a simulator or physical device.

## Running Tests

### Backend Tests

- Run unit tests:
  ```bash
  npm run test
  ```
- Run end-to-end tests:
  ```bash
  npm run test:e2e
  ```

## API Endpoints

- **POST** `/auth/login`: User login
- **POST** `/users`: Register a new user
- **PATCH** `/users/update`: Update user profile
- **POST** `/study-record`: Upsert study record
- **GET** `/study-record`: Get all study records
- **GET** `/study-record/:userId`: Get a specific user's study record

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Author

- **Backend**: [Larry Wen](https://experts.griffith.edu.au/8677-larry-wen)
- **Frontend**: Mengning Li

## Acknowledgments

- Griffith University for course support and guidance.
- Open-source libraries and contributors.