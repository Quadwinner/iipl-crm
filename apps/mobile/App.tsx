import { NavigationContainer, DarkTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './src/auth/auth'
import { ComplaintsScreen } from './src/screens/complaints'
import { HomeScreen } from './src/screens/home'
import { InvoicesScreen } from './src/screens/invoices'
import { Loading } from './src/components/ui'
import { MoreScreen } from './src/screens/more'
import { NoAccessScreen } from './src/screens/no-access'
import { SignInScreen } from './src/screens/sign-in'
import { theme } from './src/theme/theme'
import { View } from 'react-native'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mobile connections drop often; one retry covers a blip without stalling the UI.
      retry: 1,
      staleTime: 30_000,
    },
  },
})

const Tab = createBottomTabNavigator()

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.color.bg,
    card: theme.color.surface,
    border: theme.color.border,
    text: theme.color.text,
    primary: theme.color.accent,
  },
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.color.bg },
        headerTitleStyle: { color: theme.color.text },
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.color.accent,
        tabBarInactiveTintColor: theme.color.muted,
        tabBarStyle: { backgroundColor: theme.color.surface, borderTopColor: theme.color.border },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Invoices" component={InvoicesScreen} />
      <Tab.Screen name="Complaints" component={ComplaintsScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  )
}

/**
 * Routing is decided by role, not by the screen: only OFFICE_OWNER has owner rows
 * to read, so any other role gets told plainly instead of shown empty tabs.
 */
function Root() {
  const { status, role } = useAuth()

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: theme.color.bg, justifyContent: 'center' }}>
        <Loading />
      </View>
    )
  }
  if (status === 'unauthenticated') return <SignInScreen />
  if (role !== 'OFFICE_OWNER') return <NoAccessScreen />

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tabs />
    </NavigationContainer>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <Root />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
