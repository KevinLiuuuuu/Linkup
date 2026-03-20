import { Client, Databases, Account, Avatars } from "react-native-appwrite";

// lib/appwrite.js
const appwriteConfig = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  projectId: "682080f6000dea98f83e",
  platform: "com.Kevzn.Linkup", 
  databaseId: "683d0bee003a81c6f15d",
  collectionIds: {
    chatRooms: "683d0c2d0012b934fe5c",
    messages: "683d0c19003d7503c601", 
    polls: "684f80130026bfe1ded7",
    poll_votes: "684f8d51002668748208"
  },
};

const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId)

const database = new Databases(client);
const account = new Account(client);
const avatars = new Avatars(client);

export { client, database, account, avatars, appwriteConfig };
