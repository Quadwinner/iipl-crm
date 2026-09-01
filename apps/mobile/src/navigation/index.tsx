import { DarkTheme, NavigationContainer, useNavigation } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Pressable, Text } from 'react-native'
import { Grid2x2, Home, Layers, Mail, User, Wrench } from 'lucide-react-native'
import { useAuth } from '../auth/auth'
import { Loading } from '../components/ui'
import { LauncherScreen } from '../screens/launcher'
import { ModuleComingSoonScreen } from '../screens/module-coming-soon'
import { AdminModule } from '../modules/admin'
import { RentalModule } from '../modules/rental'
import { SignInScreen } from '../screens/sign-in'
import { StartupFailure } from '../screens/startup-failure'
import { HomeScreen } from '../screens/site/home'
import {
  AboutScreen,
  ContactScreen,
  IndustriesScreen,
  ProductsScreen,
  QuoteScreen,
  ServiceDetailScreen,
  ServicesScreen,
} from '../screens/site/pages'
import { AccountScreen } from '../screens/account'
import { theme } from '../theme/theme'

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.color.bg,
    card: theme.color.bg,
    border: theme.color.border,
    text: theme.color.text,
    primary: theme.color.accent,
  },
}

const screenOptions = {
  headerStyle: { backgroundColor: theme.color.bg },
  headerTitleStyle: { color: theme.color.text },
  headerTintColor: theme.color.accent,
  headerShadowVisible: false,
} as const

const tabOptions = {
  ...screenOptions,
  tabBarActiveTintColor: theme.color.accent,
  tabBarInactiveTintColor: theme.color.muted,
  tabBarStyle: { backgroundColor: theme.color.surface, borderTopColor: theme.color.border },
} as const

const PublicTab = createBottomTabNavigator()
const AppTab = createBottomTabNavigator()
const RootStack = createNativeStackNavigator()

/** The company site, browsable without an account — same as the website's front. */
function PublicTabs() {
  return (
    <PublicTab.Navigator screenOptions={tabOptions}>
      <PublicTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Itoby',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          headerRight: () => <SignInLink />,
        }}
      />
      <PublicTab.Screen
        name="Services"
        component={ServicesScreen}
        options={{ tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} /> }}
      />
      <PublicTab.Screen
        name="Products"
        component={ProductsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Layers color={color} size={size} /> }}
      />
      <PublicTab.Screen
        name="Contact"
        component={ContactScreen}
        options={{ tabBarIcon: ({ color, size }) => <Mail color={color} size={size} /> }}
      />
    </PublicTab.Navigator>
  )
}

/** Signed in: the launcher first, with the public site still reachable. */
function AppTabs() {
  return (
    <AppTab.Navigator screenOptions={tabOptions}>
      <AppTab.Screen
        name="Apps"
        component={LauncherScreen}
        options={{ tabBarIcon: ({ color, size }) => <Grid2x2 color={color} size={size} /> }}
      />
      <AppTab.Screen
        name="Explore"
        component={HomeScreen}
        options={{ title: 'Itoby', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <AppTab.Screen
        name="Account"
        component={AccountScreen}
        options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </AppTab.Navigator>
  )
}

/** Header action on the public home tab. */
function SignInLink() {
  const navigation = useNavigation<any>()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => navigation.navigate('SignIn')}
      style={({ pressed }) => [{ paddingHorizontal: theme.space(3) }, pressed && { opacity: 0.6 }]}
    >
      <Text style={{ color: theme.color.accent, fontSize: 15, fontWeight: '700' }}>Sign in</Text>
    </Pressable>
  )
}

/**
 * Auth decides which stack exists, not which screen is shown. Keeping the two
 * apart means a signed-out visitor can browse the whole company site, and a
 * sign-out cannot strand anyone inside a module screen.
 */
export function RootNavigator() {
  const { status, failure } = useAuth()

  if (status === 'loading') return <Loading />
  if (status === 'broken') return <StartupFailure error={failure} />

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={screenOptions}>
        {status === 'authenticated' ? (
          <>
            <RootStack.Screen name="App" component={AppTabs} options={{ headerShown: false }} />
            <RootStack.Screen
              name="Rental"
              component={RentalModule}
              options={{ title: 'IIPL Renting' }}
            />
            <RootStack.Screen
              name="Workspace"
              component={AdminModule}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <RootStack.Screen name="Site" component={PublicTabs} options={{ headerShown: false }} />
            <RootStack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign in' }} />
          </>
        )}

        {/* Reachable from either stack. */}
        <RootStack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
        <RootStack.Screen
          name="ServiceDetail"
          component={ServiceDetailScreen}
          options={{ title: 'Service' }}
        />
        <RootStack.Screen
          name="Industries"
          component={IndustriesScreen}
          options={{ title: 'Industries' }}
        />
        <RootStack.Screen name="Quote" component={QuoteScreen} options={{ title: 'Request a quote' }} />
        <RootStack.Screen
          name="ModuleComingSoon"
          component={ModuleComingSoonScreen}
          options={{ title: '' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  )
}
