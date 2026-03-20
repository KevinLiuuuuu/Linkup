import { View, Text, Button } from "react-native";
import React, { useContext, useState } from "react";
import { Stack, router } from "expo-router";
import { UserContext } from "../../contexts/UserContext";
import { useUser } from "../../hooks/useUser";
import Input from "../../components/input";
import { appwriteConfig, database } from "../../lib/appwrite";
import { ID } from "react-native-appwrite";

export default function NewRoom() {
  const { user, authChecked } = useUser(); // make sure to get authChecked too
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function createRoom() {
  // ✅ Prevent creation if user is not ready
  console.log("Creating room with creatorId:", user?.$id);
  
  if (!authChecked || !user?.$id) {
    console.warn("User not ready — cannot create room.");
    return;
  }

  try {
    setIsLoading(true);

    console.log("Creating room with creatorId:", user?.$id); // Debug log

    const room = await database.createDocument(
      String(appwriteConfig.databaseId),
      String(appwriteConfig.collectionIds.chatRooms),
      ID.unique(),
      {
        title: roomName,
        description: roomDescription,
        creatorId: user.$id,
      }
    );

    console.log("Room created:", room);
  } catch (error) {
    console.error("Error creating room:", error);
  } finally {
    setIsLoading(false);
    router.back();
  }
}


  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button
              title={isLoading ? "Creating..." : "Create"}
              disabled={!authChecked || !user || roomName === ""}
              onPress={createRoom}
            />
          ),
        }}
      />
      <View style={{ padding: 16, gap: 16 }}>
        <Text>Create a New Room</Text>
        <Input 
          placeholder="Room Name"
          value={roomName}
          onChangeText={setRoomName}
          maxLength={200}
        />
        <Input
          placeholder="Room Description"
          value={roomDescription}
          onChangeText={setRoomDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
          style={{ height: 100 }}
          textAlign="top"
        />
      </View>
    </>
  );
}
