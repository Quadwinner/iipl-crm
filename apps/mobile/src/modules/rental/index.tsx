import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Building2, FileText, MessageSquare, MoreHorizontal } from 'lucide-react-native'
import { useAuth } from '../../auth/auth'
import { NoAccessScreen } from '../../screens/no-access'
import { ComplaintsScreen } from './complaints'
import { InvoicesScreen } from './invoices'
import { LeasesScreen } from './leases'
import { MoreScreen } from './more'
import { theme } from '../../theme/theme'

const Tab = createBottomTabNavigator()

/**
 * IIPL Renting, mounted inside the superapp.
 *
 * The role branch happens before any owner screen renders. Every query in here
 * is owner-scoped by RLS resolved from the session, so an administrator would
 * see empty lists rather than an error — saying so is more useful than four
 * blank tabs. The web module has the same branch for a sharper reason: its owner
 * auth provider signs out non-owner sessions.
 */
export function RentalModule() {
  const { role } = useAuth()
  if (role !== 'OFFICE_OWNER') return <NoAccessScreen />

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.color.accent,
        tabBarInactiveTintColor: theme.color.muted,
        tabBarStyle: { backgroundColor: theme.color.surface, borderTopColor: theme.color.border },
      }}
    >
      <Tab.Screen
        name="Leases"
        component={LeasesScreen}
        options={{ tabBarIcon: ({ color, size }) => <Building2 color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoicesScreen}
        options={{ tabBarIcon: ({ color, size }) => <FileText color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Complaints"
        component={ComplaintsScreen}
        options={{ tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} /> }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{ tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} /> }}
      />
    </Tab.Navigator>
  )
}
