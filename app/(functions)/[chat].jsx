import { Ionicons } from "@expo/vector-icons";
import * as React from "react";
import { LegendList } from "@legendapp/list";
import { useUser } from "../../hooks/useUser";
import { useLocalSearchParams, Stack, router} from "expo-router";
import {
  ActivityIndicator,
  Text,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
  TouchableOpacity,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { database, appwriteConfig } from "../../lib/appwrite";
import { ID, Query } from "react-native-appwrite";

export default function Chat() {
  const params = useLocalSearchParams();
  const chatId = params?.chat;

  const { user, authChecked } = useUser();

  const [messageContent, setMessageContent] = React.useState("");
  const [pollQuestion, setPollQuestion] = React.useState(""); 
  const [chatRoom, setChatRoom] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [voting, setVoting] = React.useState(false);  // NEW voting state

  const headerHeight = Platform.OS === "ios" ? useHeaderHeight() : 0;

  React.useEffect(() => {
    if (chatId) {
      handleFirstLoad();
    }
  }, [chatId]);

  const handleFirstLoad = async () => {
    try {
      await getChatRoom();
      await getMessages();
    } catch (e) {
      console.log("Error during initial load:", e);
    }
  };

  const getChatRoom = async () => {
    try {
      const data = await database.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collectionIds.chatRooms,
        String(chatId)
      );
      setChatRoom(data);
    } catch (e) {
      console.log("Error fetching chat room:", e);
    }
  };

  const getMessages = async () => {
    try {
      const [messagesRes, pollsRes, userVotesRes] = await Promise.all([
        database.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collectionIds.messages,
          [
            Query.equal("chatRoomId", String(chatId)),
            Query.limit(100),
            Query.orderAsc("$createdAt"),
          ]
        ),
        database.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collectionIds.polls,
          [
            Query.equal("chatRoomId", String(chatId)),
            Query.limit(100),
            Query.orderAsc("$createdAt"),
          ]
        ),
        database.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collectionIds.poll_votes,
          [
            Query.equal("voterId", user?.$id),
          ]
        ),
      ]);

      const voteMap = {};
      userVotesRes.documents.forEach((vote) => {
        voteMap[vote.pollId] = vote.vote;
      });

      const pollsWithVoteInfo = pollsRes.documents.map((poll) => ({
        ...poll,
        userVote: voteMap[poll.$id] || null,
      }));

      const combined = [...messagesRes.documents, ...pollsWithVoteInfo];

      combined.sort((a, b) => new Date(a.$createdAt) - new Date(b.$createdAt));

      setMessages(combined);
    } catch (e) {
      console.log("Error fetching messages and polls:", e);
    }
  };

  const sendMessage = async () => {
    if (messageContent.trim() === "") return;

    const message = {
      content: messageContent,
      senderId: user?.$id,
      senderName: user?.email,
      chatRoomId: chatId,
    };

    try {
      await database.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collectionIds.messages,
        ID.unique(),
        message
      );

      setMessageContent("");
      Keyboard.dismiss();
      await getMessages();
    } catch (e) {
      console.log("Error sending message:", e);
    }
  };

  const createPoll = async () => {
    if (!pollQuestion.trim()) return;

    try {
      const poll = await database.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collectionIds.polls,
        ID.unique(),
        {
          chatRoomId: chatId,
          question: pollQuestion.trim(),
          creatorId: user?.$id,
          yesVotes: 0,
          noVotes: 0, 
        }
      );
      console.log("Poll created:", poll);
      setPollQuestion("");
      await getMessages();
    } catch (e) {
      console.log("Poll creation error", e);
    }
  };

  const voteOnPoll = async (pollId, voteValue) => {
    if (voting) return; // prevent multiple simultaneous votes

    setVoting(true);
    try {
      const existingVotes = await database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collectionIds.poll_votes,
        [
          Query.equal("pollId", pollId),
          Query.equal("voterId", user?.$id),
        ]
      );

      if (existingVotes.total > 0) {
        console.log("User has already voted on this poll.");
        setVoting(false);
        return;
      }

      await database.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collectionIds.poll_votes,
        ID.unique(),
        {
          pollId,
          voterId: user?.$id,
          voterEmail: user?.email,
          vote: voteValue,
        }
      );

      const poll = await database.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collectionIds.polls,
        pollId
      );

      const updatedVotes = {
        yesVotes: voteValue === "yes" ? (poll.yesVotes || 0) + 1 : poll.yesVotes || 0,
        noVotes: voteValue === "no" ? (poll.noVotes || 0) + 1 : poll.noVotes || 0,
      };

      await database.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collectionIds.polls,
        pollId,
        updatedVotes
      );

      await getMessages();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.$id === pollId
            ? {
                ...msg,
                yesVotes: updatedVotes.yesVotes,
                noVotes: updatedVotes.noVotes,
                userVote: voteValue,
              }
            : msg
        )
      );

      console.log("Vote submitted and poll updated");
    } catch (e) {
      console.log("Vote error", e);
    } finally {
      setVoting(false);
    }
  };

const handleDeleteChat = async () => {
  Alert.alert(
    "Delete Group Chat",
    "Are you sure you want to delete this group chat?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await database.deleteDocument(
              appwriteConfig.databaseId,
              appwriteConfig.collectionIds.chatRooms,
              String(chatId)
            );
            router.replace("/chats");
          } catch (e) {
            console.log("Error deleting chat:", e);
          }
        },
      },
    ]
  );
};


  if (!authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!user) {
    return <Text>User not logged in.</Text>;
  }

  if (!chatId) {
    return <Text>We couldn't find the room.</Text>;
  }

return (
  <>
    {chatRoom && (
      <Stack.Screen
  options={{
    title: chatRoom?.title || "Chat",
    headerRight: () => (
      <View style={{ flexDirection: "row" }}>
        <Pressable
          onPress={() => router.push("/settings/[chat].jsx")}
          style={{ marginRight: 15 }}
        >
          <Ionicons name="images-outline" size={24} color="white" />
        </Pressable>

        {chatRoom?.creatorId === user?.$id && (
          <Pressable onPress={handleDeleteChat}>
            <Ionicons name="trash-outline" size={24} color="red" />
          </Pressable>
        )}
      </View>
    ),
  }}
  />
    )}



      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={headerHeight}
        >
          {chatRoom && (
            <View style={{ margin: 10, padding: 10, backgroundColor: "#111", borderRadius: 10 }}>
              <Text style={{ color: "white", marginBottom: 6 }}>Create a Poll</Text>

              <TextInput
                placeholder="Enter your poll question"
                value={pollQuestion}
                onChangeText={setPollQuestion}
                style={{
                  backgroundColor: "white",
                  borderRadius: 5,
                  paddingHorizontal: 10,
                  marginBottom: 8,
                  height: 40,
                }}
              />

              <Pressable
                style={{ backgroundColor: pollQuestion.trim() ? "blue" : "gray", padding: 10, borderRadius: 5 }}
                onPress={createPoll}
                disabled={!pollQuestion.trim()}
              >
                <Text style={{ color: "white", textAlign: "center" }}>Create Yes/No Poll</Text>
              </Pressable>
            </View>
          )}

          <LegendList
            data={messages}
            renderItem={({ item }) => {
              if (item.question) {
                const hasVoted = !!item.userVote;

                return (
                  <View
                    style={{
                      backgroundColor: "#333",
                      padding: 10,
                      borderRadius: 10,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "bold" }}>{item.question}</Text>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                      {["yes", "no"].map((voteValue) => {
                        const voteCount =
                          voteValue === "yes" ? item.yesVotes || 0 : item.noVotes || 0;
                        const isVotedOption = hasVoted && item.userVote === voteValue;

                        return (
                          <View
                            key={voteValue}
                            style={{ flex: 1, opacity: hasVoted && !isVotedOption ? 0.4 : 1 }}
                          >
                            <TouchableOpacity
                              disabled={hasVoted || voting}  // disable while voting
                              onPress={() => voteOnPoll(item.$id, voteValue)}
                              style={{
                                backgroundColor: voteValue === "yes" ? "green" : "red",
                                padding: 10,
                                borderRadius: 5,
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ color: "white" }}>
                                {voteValue.toUpperCase()} ({voteCount})
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>

                    {hasVoted && (
                      <Text style={{ color: "lightgray", marginTop: 6 }}>
                        You voted: {item.userVote.toUpperCase()}
                      </Text>
                    )}
                  </View>
                );
              }

              const isSender = item.senderId === user?.$id;

              return (
                <View
                  style={{
                    padding: 8,
                    alignItems: isSender ? "flex-end" : "flex-start",
                    borderRadius: 10,
                    flexDirection: "row",
                    gap: 6,
                    maxWidth: "80%",
                    alignSelf: isSender ? "flex-end" : "flex-start",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isSender ? "lightblue" : "lightgreen",
                      flex: 1,
                      padding: 10,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ fontWeight: "bold", marginBottom: 4 }}>{item.senderName}</Text>
                    <Text>{item.content}</Text>
                    <Text style={{ fontSize: 10, textAlign: "right" }}>
                      {item.$createdAt
                        ? new Date(item.$createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </Text>
                  </View>
                </View>
              );
            }}
            keyExtractor={(item) => item?.$id ?? "unknown"}
            contentContainerStyle={{ padding: 10 }}
            recycleItems={true}
            initialScrollIndex={messages.length - 1}
            alignItemsAtEnd
            maintainScrollAtEnd
            maintainScrollAtEndThreshold={0.5}
            maintainVisibleContentPosition
            estimatedItemSize={100}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderRadius: 20,
              marginBottom: 8,
              marginHorizontal: 10,
            }}
          >
            <TextInput
              placeholder="message"
              value={messageContent}
              onChangeText={setMessageContent}
              style={{
                minHeight: 40,
                flexGrow: 1,
                flexShrink: 1,
                padding: 10,
              }}
              multiline
              placeholderTextColor={"gray"}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <Pressable
              disabled={messageContent === ""}
              style={{
                width: 50,
                height: 50,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={sendMessage}
            >
              <Ionicons
                name="send-outline"
                size={24}
                color={messageContent === "" ? "gray" : "blue"}
              />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
