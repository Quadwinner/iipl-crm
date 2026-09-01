import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Building2, LayoutDashboard, Users, Wrench } from 'lucide-react-native'
import { AdminComplaintDetailScreen } from './complaint-detail'
import {
  AdminBuildingsScreen,
  AdminComplaintsScreen,
  AdminDashboardScreen,
  AdminStaffScreen,
  AdminTenantsScreen,
  AdminUnitsScreen,
} from './screens'
import { theme } from '../../../theme/theme'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const screenOptions = {
  headerStyle: { backgroundColor: theme.color.bg },
  headerTitleStyle: { color: theme.color.text },
  headerTintColor: theme.color.accent,
  headerShadowVisible: false,
} as const

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        ...screenOptions,
        headerShown: false,
        tabBarActiveTintColor: theme.color.accent,
        tabBarInactiveTintColor: theme.color.muted,
        tabBarStyle: { backgroundColor: theme.color.surface, borderTopColor: theme.color.border },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={AdminDashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Queue"
        component={AdminComplaintsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Property"
        component={AdminBuildingsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} /> }}
      />
      <Tab.Screen
        name="People"
        component={AdminTenantsScreen}
        options={{ tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
      />
    </Tab.Navigator>
  )
}

/**
 * The staff side of IIPL Renting.
 *
 * Administrators and maintenance staff share these screens; what each can
 * actually do is decided by the database, not by hiding tabs. The one exception
 * is complaint assignment, which is Administrator-only and would be refused for
 * staff — that control is hidden rather than offered and rejected.
 */
export function RentalAdmin() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AdminUnits" component={AdminUnitsScreen} options={{ title: 'Units' }} />
      <Stack.Screen
        name="AdminComplaintDetail"
        component={AdminComplaintDetailScreen}
        options={{ title: 'Complaint' }}
      />
      <Stack.Screen name="AdminStaff" component={AdminStaffScreen} options={{ title: 'Staff' }} />
    </Stack.Navigator>
  )
}
