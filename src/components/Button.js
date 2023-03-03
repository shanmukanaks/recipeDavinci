import * as React from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { AntDesign } from "@expo/vector-icons";

export default function Button({ title, onPress, icon, color }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button}>
      <AntDesign name={icon} size={28} color={color ? color : "#f1f1f1"} />
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    // elevation: 8,
    backgroundColor: "darkorange",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 50,
    height: 50,
  },
});
