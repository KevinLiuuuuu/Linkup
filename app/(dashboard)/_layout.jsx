import { Link, Tabs } from "expo-router"
import { useColorScheme } from "react-native"
import { Colors } from "../../constants/Colors"
import { Ionicons } from "@expo/vector-icons"
import UserOnly from "../../components/auth/UserOnly"

export default function DashboardLayout() {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  return (
    <UserOnly>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: theme.navBackground, paddingTop: 10, height: 90 },
          tabBarActiveTintColor: theme.iconColorFocused,
          tabBarInactiveTintColor: theme.iconColor,
        }}
      >
        <Tabs.Screen 
          name="profile"
          options={{ title: "Profile", tabBarIcon: ({ focused }) => (
            <Ionicons 
              size={24} 
              name={focused ? 'person': 'person-outline'} 
              color={focused ? theme.iconColorFocused : theme.iconColor} 
            />
          )}}
        />
        <Tabs.Screen 
          name="chats"
          options={{ 
            title: "Groupchats", 
            headerLargeTitle: true, 
            headerTitle: "Chat Rooms (Scroll down for refresh)", 
            headerShown: true, 
            headerTintColor: "black",
            headerRight: () => (
              <Link href="/(functions)/new-room">
                <Ionicons
                  size={28}
                  name="add-circle-outline" 
                  color="black"
                />
              </Link>
            ),
            tabBarIcon: ({ focused }) => (
              <Ionicons 
                size={24} 
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
                color={focused ? theme.iconColorFocused : theme.iconColor} 
              />
            )
          }} 
        />
        <Tabs.Screen 
          name="polls"
          options={{ title: "Polls",headerTitle:"Polls (Scroll down for refresh)", headerShown:true, tabBarIcon: ({ focused }) => (
            <Ionicons 
              size={24} 
              name={focused ? 'list': 'list-outline'} 
              color={focused ? theme.iconColorFocused : theme.iconColor} 
            />
          )}} 
        />
        <Tabs.Screen 
          name="maps"
          options={{ title: "Map", tabBarIcon: ({ focused }) => (
            <Ionicons 
              size={24} 
              name={focused ? 'map': 'map-outline'} 
              color={focused ? theme.iconColorFocused : theme.iconColor} 
            />
          )}} 
        />
      </Tabs>
    </UserOnly>
  )
}