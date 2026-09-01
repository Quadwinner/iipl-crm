import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { RootParamList } from '../../navigation/types'
import {
  Building2,
  FileText,
  MessageSquare,
  MoreHorizontal,
} from 'lucide-react-native'
import type { InvoiceRow } from '@itoby/shared/owner'
import { useAuth } from '../../auth/auth'
import { RentalAdmin } from './admin'
import { NoAccessScreen } from '../../screens/no-access'
import { ComplaintsScreen } from './complaints'
import { ComplaintDetailScreen } from './complaint-detail'
import { DocumentsScreen } from './documents'
import { InvoicesScreen } from './invoices'
import { LeasesScreen } from './leases'
import { MoreScreen } from './more'
import { NewComplaintScreen } from './new-complaint'
import { PayInvoiceScreen } from './pay-invoice'
import { ProfileScreen } from './profile'
import { ReceiptsScreen } from './receipts'
import { RemindersScreen } from './reminders'
import { theme } from '../../theme/theme'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const screenOptions = {
  headerStyle: { backgroundColor: theme.color.bg },
  headerTitleStyle: { color: theme.color.text },
  headerTintColor: theme.color.accent,
  headerShadowVisible: false,
} as const

function RentalTabs() {
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

/** Payment is pushed rather than shown in a sheet: the WebView needs a full screen. */
function PayInvoiceRoute() {
  const navigation = useNavigation()
  const route = useRoute<RouteProp<RootParamList, 'PayInvoice'>>()
  return <PayInvoiceScreen invoice={route.params.invoice} onDone={() => navigation.goBack()} />
}

function NewComplaintRoute() {
  const navigation = useNavigation()
  return <NewComplaintScreen onDone={() => navigation.goBack()} />
}

/**
 * IIPL Renting, mounted inside the superapp.
 *
 * The role branch happens before any screen renders: staff get the admin side,
 * owners get theirs. This matters beyond routing — owner queries are scoped by
 * RLS from the session, so an administrator opening the owner tabs would see
 * four empty lists rather than an error. The web module branches for a sharper
 * reason still: its owner auth provider signs out non-owner sessions.
 */
export function RentalModule() {
  const { role } = useAuth()

  if (role === 'ADMINISTRATOR' || role === 'MAINTENANCE_STAFF') return <RentalAdmin />
  if (role !== 'OFFICE_OWNER') return <NoAccessScreen />

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="RentalTabs" component={RentalTabs} options={{ headerShown: false }} />
      <Stack.Screen name="PayInvoice" component={PayInvoiceRoute} options={{ title: 'Pay invoice' }} />
      <Stack.Screen
        name="NewComplaint"
        component={NewComplaintRoute}
        options={{ title: 'Raise a complaint' }}
      />
      <Stack.Screen
        name="ComplaintDetail"
        component={ComplaintDetailScreen}
        options={{ title: 'Complaint' }}
      />
      <Stack.Screen name="Receipts" component={ReceiptsScreen} options={{ title: 'Receipts' }} />
      <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Documents' }} />
      <Stack.Screen name="Reminders" component={RemindersScreen} options={{ title: 'Reminders' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Your profile' }} />
    </Stack.Navigator>
  )
}
