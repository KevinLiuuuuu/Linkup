import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, Text, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { UserProvider } from "../contexts/UserContext";
import { Colors } from "../constants/Colors";
import { Ionicons } from '@expo/vector-icons';


export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme()

const theme = colorScheme && Colors[colorScheme] ? Colors[colorScheme] : Colors.light;
  // Safely handle undefined colorScheme

  return (
    <UserProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.navBackground },
          headerTintColor: theme.title,
        }}
      >
        {/* Groups */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
        
        {/* Modal Screen with Back Button */}
        <Stack.Screen
          name="(functions)/new-room"
          options={{
            presentation: "modal",
            headerTitle: "New Chat Room",
            headerLeft: () => (
              <TouchableOpacity 
                onPress={() => router.back()}
                style={{ marginLeft: 15 }}
              >
                                <Ionicons 
                  name="arrow-back" 
                  size={24} 
                  color={theme.title} 
                />
              </TouchableOpacity>
            ),
          }}
        />

        <Stack.Screen
          name = "(functions)/[chat]"
          options = {{
            headerTitle: ""
          }}
        />
        <Stack.Screen
          name = "(functions)/settings/[chat]"
          options = {{
            headerTitle: "Room Settings",
            presentation: "modal"
          }}
        />
        {/* Home Screen */}
        <Stack.Screen name="index" options={{ title: "Home" }} />
      </Stack>
    </UserProvider>
  );
}