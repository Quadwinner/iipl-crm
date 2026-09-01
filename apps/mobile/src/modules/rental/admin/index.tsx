import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Building2, LayoutDashboard, Settings2, Users, Wrench } from 'lucide-react-native'
import { AdminComplaintDetailScreen } from './complaint-detail'
import {
  AdminAllotmentsScreen,
  AdminAuditScreen,
  AdminBillingScreen,
  AdminExpensesScreen,
} from './finance'
import { AdminManageScreen, AdminSettingsScreen } from './manage'
import {
  AdminBuildingsScreen,
  AdminComplaintsScreen,
  AdminDashboardScreen,
  AdminStaffScreen,
  AdminTenantsScreen,
  AdminUnitsScreen,
} from './screens'
import { useTheme, type Theme } from '../../../theme/theme'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

/** Navigator options depend on the active theme, so they are built per render
 *  rather than frozen at module scope. */
const screenOptions = (theme: Theme) =>
  ({
    headerStyle: { backgroundColor: theme.color.bg },
    headerTitleStyle: { color: theme.color.text },
    headerTintColor: theme.color.accent,
    headerShadowVisible: false,
  }) as const

function AdminTabs() {
  const { theme } = useTheme()
  return (
    <Tab.Navigator
      screenOptions={{
        ...screenOptions(theme),
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
      <Tab.Screen
        name="Manage"
        component={AdminManageScreen}
        options={{ tabBarIcon: ({ color, size }) => <Settings2 color={color} size={size} /> }}
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
  const { theme } = useTheme()
  return (
    <Stack.Navigator screenOptions={screenOptions(theme)}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
      <Stack.Screen name="AdminUnits" component={AdminUnitsScreen} options={{ title: 'Units' }} />
      <Stack.Screen
        name="AdminComplaintDetail"
        component={AdminComplaintDetailScreen}
        options={{ title: 'Complaint' }}
      />
      <Stack.Screen name="AdminStaff" component={AdminStaffScreen} options={{ title: 'Staff' }} />
      <Stack.Screen
        name="AdminAllotments"
        component={AdminAllotmentsScreen}
        options={{ title: 'Allotments' }}
      />
      <Stack.Screen
        name="AdminBilling"
        component={AdminBillingScreen}
        options={{ title: 'Billing' }}
      />
      <Stack.Screen
        name="AdminExpenses"
        component={AdminExpensesScreen}
        options={{ title: 'Expenses' }}
      />
      <Stack.Screen name="AdminAudit" component={AdminAuditScreen} options={{ title: 'Audit log' }} />
      <Stack.Screen
        name="AdminSettings"
        component={AdminSettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  )
}
