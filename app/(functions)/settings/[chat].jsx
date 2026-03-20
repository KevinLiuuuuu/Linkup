import { View, Text, StyleSheet } from "react-native";

export default function PhotoGallery() {
  return (
    <View style={styles.container}>
      <Text>You have not allowed permissions to access photo gallery or camera</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
