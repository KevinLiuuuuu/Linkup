import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useUser } from "../../hooks/useUser";
import { database, appwriteConfig } from "../../lib/appwrite";
import { Query, ID } from "react-native-appwrite";

import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import ThemedButton from "../../components/ThemedButton";

const Profile = () => {
  const { logout, user } = useUser();

  const [unansweredPolls, setUnansweredPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnansweredPolls();
    }
  }, [user]);

  const fetchUnansweredPolls = async () => {
    setLoading(true);
    try {
      // 1. Get all polls
      const pollsRes = await database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collectionIds.polls,
        [Query.limit(100), Query.orderAsc("$createdAt")]
      );

      // 2. Get all votes by this user
      const votesRes = await database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collectionIds.poll_votes,
        [Query.equal("voterId", user.$id)]
      );

      // 3. Build a set of pollIds user already voted on
      const votedPollIds = new Set(votesRes.documents.map((v) => v.pollId));

      // 4. Filter polls that user has NOT voted on
      const unanswered = pollsRes.documents.filter(
        (poll) => !votedPollIds.has(poll.$id)
      );

      setUnansweredPolls(unanswered);
      setModalVisible(unanswered.length > 0);
    } catch (e) {
      console.log("Error fetching unanswered polls:", e);
    }
    setLoading(false);
  };

  const voteOnPoll = async (pollId, voteValue) => {
    try {
      // Prevent duplicate voting race condition by double checking
      const existingVotes = await database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collectionIds.poll_votes,
        [
          Query.equal("pollId", pollId),
          Query.equal("voterId", user.$id),
        ]
      );
      if (existingVotes.total > 0) {
        // Already voted, remove from unanswered
        setUnansweredPolls((prev) =>
          prev.filter((p) => p.$id !== pollId)
        );
        if (unansweredPolls.length <= 1) setModalVisible(false);
        return;
      }

      // Create vote document
      await database.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collectionIds.poll_votes,
        ID.unique(),
        {
          pollId,
          voterId: user.$id,
          voterEmail: user.email,
          vote: voteValue,
        }
      );

      // Update poll counts atomically would be better but here simple fetch/update
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

      // Remove answered poll from state
      setUnansweredPolls((prev) => prev.filter((p) => p.$id !== pollId));

      // Hide modal if no polls left
      if (unansweredPolls.length <= 1) {
        setModalVisible(false);
      }
    } catch (e) {
      console.log("Vote error:", e);
    }
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Please log in.</ThemedText>
      </ThemedView>
    );
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText title={true} style={styles.heading}>
        {user.email}
      </ThemedText>
      <Spacer />

      <ThemedButton onPress={logout} style={styles.button}>
        <Text style={{ color: "#f2f2f2" }}>Logout</Text>
      </ThemedButton>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          // Prevent closing modal without answering polls
          if (unansweredPolls.length === 0) setModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>You have unanswered polls!</Text>

            {unansweredPolls.map((poll) => (
              <View key={poll.$id} style={styles.pollContainer}>
                <Text style={styles.pollQuestion}>{poll.question}</Text>

                <View style={styles.voteButtons}>
                  <TouchableOpacity
                    style={[styles.voteButton, { backgroundColor: "green" }]}
                    onPress={() => voteOnPoll(poll.$id, "yes")}
                  >
                    <Text style={styles.voteText}>YES</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.voteButton, { backgroundColor: "red" }]}
                    onPress={() => voteOnPoll(poll.$id, "no")}
                  >
                    <Text style={styles.voteText}>NO</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {unansweredPolls.length === 0 && (
              <ThemedButton
                onPress={() => setModalVisible(false)}
                style={{ marginTop: 20 }}
              >
                <Text style={{ color: "#f2f2f2" }}>Close</Text>
              </ThemedButton>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  heading: {
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "blue",
    borderRadius: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#222",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 20,
    color: "white",
    marginBottom: 12,
    textAlign: "center",
  },
  pollContainer: {
    marginBottom: 15,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  voteButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  voteButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 6,
  },
  voteText: {
    color: "white",
    fontWeight: "bold",
  },
});
