import {useEffect, useState} from "react";
import { StyleSheet, FlatList, Text, View, RefreshControl } from 'react-native';  // Fixed FlatList and added Text import
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons"
import {ChatRoom} from "../../utils/types"
import { Query } from "react-native-appwrite";
import { appwriteConfig, database} from "../../lib/appwrite";


export default function Chats() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect (() => {
    fetchChatRooms();
  },[]);

  const fetchChatRooms = async () => {
    try {
      const {documents, total} = await database.listDocuments(
        String(appwriteConfig.databaseId), 
        String(appwriteConfig.collectionIds.chatRooms),
        [Query.limit(100)]
      )
      setChatRooms(documents as ChatRoom[])
    } catch(e) {
      console.log(e)
    }
  }
  const handleRefresh = async () => {
    try {
      
      setRefreshing(true);
      await fetchChatRooms();
      console.log("refreshed")
    } catch(e) {
      console.log(e)
    } finally {
      setRefreshing(false);
    }
  };
    return (
    <FlatList
      data={chatRooms}
      keyExtractor={item => item.$id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh}/>}
      renderItem={({ item }) => (
        <Link href={{
          pathname: "../(functions)/[chat]",
          params: { chat: item.$id }
        }}>
          <View

          style={{
                gap: 6,
                padding: 16,
                width: "100%",
                borderRadius: 16,
                alignItems: "center",
                flexDirection: "row",
                backgroundColor: "#262626",
                justifyContent: "space-between",
              }}
          >
          <ItemTitleAndDescription
          title={item.title}
          description = {item.description} 
          />
              <Ionicons 
                size={24} 
                name={'chevron-forward-outline'} 
              />
          </View>
        </Link>
      )}
      contentInsetAdjustmentBehavior='automatic'
      contentContainerStyle= {{
        padding:16,
        gap:16
      }
    }
    />
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "stretch",
  },
  heading: {
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
});

function ItemTitle({title}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Text style={{ fontSize: 17, color:"#FFFFFF" }}>{title}</Text>
    </View> 
  );
}

function ItemTitleAndDescription({
  title,
  description,
}) {  
  return (
    <View style={{ gap: 4 }}>
      <ItemTitle title={title}/>
      <Text style={{ fontSize: 13, color: "#666666" }}>{description}</Text>
    </View>
  );
}