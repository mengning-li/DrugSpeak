import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import IconButton from './IconButton';

/**
 * A reusable component for selecting audio playback speed
 * 
 * @param {Object} props - Component props
 * @param {number} props.currentSpeed - Current playback speed
 * @param {function} props.onSpeedChange - Callback when speed changes
 * @param {Array<number>} [props.speedOptions] - Available speed options
 * @param {Object} [props.style] - Additional styles for the component
 */
const PlaybackSpeedSelector = ({ 
  currentSpeed, 
  onSpeedChange, 
  speedOptions = [0.25, 0.33, 0.75, 1.0],
  style = {} 
}) => {
  const [showSpeedModal, setShowSpeedModal] = useState(false);

  const handleSpeedChange = (speed) => {
    onSpeedChange(speed);
    setShowSpeedModal(false);
  };

  // We'll use this function for the dropdown button
  const handleOpenModal = () => {
    setShowSpeedModal(true);
  };

  return (
    <>
      <View style={[styles.speedSelector, style]}>
        <Text style={styles.speedValue}>{currentSpeed}x</Text>
        {/* Pass the onPress handler directly to IconButton */}
        <IconButton 
          iconName="chevron-down-outline" 
          iconSize={16} 
          iconColor="black"
          title=""
          onPress={handleOpenModal}
          style={{ backgroundColor: 'transparent' }}
        />
      </View>

      {/* Speed Selection Modal */}
      <Modal
        visible={showSpeedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSpeedModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSpeedModal(false)}
        >
          <View style={styles.modalContent}>
            {speedOptions.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[styles.speedOption, currentSpeed === speed && styles.selectedSpeedOption]}
                onPress={() => handleSpeedChange(speed)}
              >
                <Text style={[styles.speedOptionText, currentSpeed === speed && styles.selectedSpeedText]}>
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  speedSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  speedValue: {
    marginRight: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: '60%',
    maxWidth: 250,
  },
  speedOption: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedSpeedOption: {
    backgroundColor: '#f0f8ff',
  },
  speedOptionText: {
    fontSize: 16,
  },
  selectedSpeedText: {
    fontWeight: 'bold',
    color: '#3498db',
  },
});

export default PlaybackSpeedSelector;