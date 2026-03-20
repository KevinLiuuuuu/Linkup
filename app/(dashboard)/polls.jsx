import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, FlatList, Text } from "react-native";
import Spacer from "../../components/Spacer";
import ThemedText from "../../components/ThemedText";
import ThemedView from "../../components/ThemedView";
import { database, appwriteConfig, account } from "../../lib/appwrite";
import { Query } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";

const Polls = () => {
  const [polls, setPolls] = useState([]);
  const [votesByPoll, setVotesByPoll] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPollsAndVotes = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);

      const user = await account.get();
      const { documents: userPolls } = await database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collectionIds.polls,
        [Query.equal("creatorId", user.$id)]
      );

      setPolls(userPolls);

      const votesData = {};

      for (const poll of userPolls) {
        const { documents: votes } = await database.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collectionIds.poll_votes,
          [Query.equal("pollId", poll.$id)]
        );

        // Use voterEmail directly from vote document, fallback to voterId if missing
        const enrichedVotes = votes.map((vote) => ({
          ...vote,
          voterEmail: vote.voterEmail || vote.voterId || "Unknown",
        }));

        votesData[poll.$id] = enrichedVotes;
      }

      setVotesByPoll(votesData);
    } catch (e) {
      console.error("Error fetching polls or votes:", e);
      setError("Failed to load your polls.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchPollsAndVotes();
  }, [fetchPollsAndVotes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPollsAndVotes();
  };

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading your polls...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={{ color: "red" }}>{error}</ThemedText>
      </ThemedView>
    );
  }

  if (polls.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>You haven't created any polls yet.</ThemedText>
        <Spacer />
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
  <FlatList
    contentContainerStyle={[styles.container, { paddingBottom: 20 }]}
    data={polls}
    keyExtractor={(item) => item.$id}
    refreshing={refreshing}
    onRefresh={onRefresh}
    renderItem={({ item: poll }) => (
      <View style={styles.pollContainer}>
        <ThemedText style={styles.pollQuestion}>{poll.question}</ThemedText>
        <View style={styles.votesContainer}>
          {(votesByPoll[poll.$id]?.length ?? 0) === 0 ? (
            <Text style={styles.noVotesText}>No votes yet</Text>
          ) : (
            votesByPoll[poll.$id].map((vote) => (
              <View key={vote.$id} style={styles.voteRow}>
                <Text style={styles.voterName}>{vote.voterEmail}</Text>
                <Text style={styles.voteValue}>{vote.vote.toUpperCase()}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    )}
  />
</SafeAreaView>

  );
};

export default Polls;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 70,
  },
  heading: {
    fontWeight: "bold",
    fontSize: 22,
    textAlign: "center",
  },
  pollContainer: {
    backgroundColor: "#444",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  pollQuestion: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  votesContainer: {
    marginLeft: 10,
  },
  voteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  voterName: {
    color: "#ddd",
  },
  voteValue: {
    fontWeight: "bold",
    color: "#fff",
  },
  noVotesText: {
    fontStyle: "italic",
    color: "#bbb",
  },
});
