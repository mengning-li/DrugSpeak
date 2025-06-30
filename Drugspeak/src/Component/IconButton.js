import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const IconButton = ({title, iconName, name, onPress, iconColor, color, iconSize, size, style, textStyle}) => {
  // Resolve fallbacks
  const iconNameToUse = iconName || name;
  const iconSizeToUse = iconSize || size || 24;
  const iconColorToUse = iconColor || color || 'black';

  // Create a handler function that ensures onPress exists before calling it
  const handlePress = () => {
    if (onPress && typeof onPress === 'function') {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.buttonContainer, style]}
      onPress={handlePress}
      // Remove hitSlop as it might be causing issues
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={title || iconNameToUse}
    >
      <View style={styles.buttonContent}>
        <Ionicons name={iconNameToUse} size={iconSizeToUse} color={iconColorToUse} />
        {title && <Text style={[styles.textBase, textStyle]}>{title}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'transparent',
    // Add padding to make the touch target larger instead of using hitSlop
    padding: 8,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  textBase: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default IconButton;