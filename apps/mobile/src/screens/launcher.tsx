import { useNavigation } from '@react-navigation/native'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { AppModule } from '@itoby/shared/site'
import { Badge, Empty, ErrorState, Loading } from '../components/ui'
import { SectionHeader } from '../components/section'
import { iconByName } from '../lib/icons'
import { useAuth } from '../auth/auth'
import { useMyModules } from '../features/site'
import { theme } from '../theme/theme'

/**
 * The launcher — the superapp's front door once signed in.
 *
 * Tiles come from modules_for_current_user(), so what a user sees is decided by
 * their role in the database. There is no client-side role filtering here to
 * get out of step with it.
 */
export function LauncherScreen() {
  const navigation = useNavigation<any>()
  const { email } = useAuth()
  const modules = useMyModules()

  if (modules.isPending) return <Loading />
  if (modules.error) return <ErrorState error={modules.error} onRetry={() => void modules.refetch()} />

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={undefined}
    >
      <SectionHeader
        eyebrow="Your workspace"
        title="Your products"
        body={email ? `Signed in as ${email}` : undefined}
      />

      {modules.data?.length === 0 ? (
        <Empty
          title="No products yet"
          hint="Your account has not been given access to a product. An administrator can grant it."
        />
      ) : null}

      <View style={styles.grid}>
        {(modules.data ?? []).map((module) => (
          <ModuleTile
            key={module.id}
            module={module}
            onPress={() => {
              if (module.status !== 'ACTIVE') {
                navigation.navigate('ModuleComingSoon', { moduleKey: module.key })
                return
              }
              // Only rental is built. Anything else registered as ACTIVE without a
              // screen here would otherwise navigate nowhere.
              navigation.navigate(module.key === 'rental' ? 'Rental' : 'ModuleComingSoon', {
                moduleKey: module.key,
              })
            }}
          />
        ))}
      </View>
    </ScrollView>
  )
}

function ModuleTile({ module, onPress }: { module: AppModule; onPress: () => void }) {
  const Icon = iconByName(module.icon)
  const available = module.status === 'ACTIVE'

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <View style={[styles.tileIcon, { backgroundColor: `${module.accent}22` }]}>
        <Icon size={24} color={module.accent} />
      </View>
      <Text style={styles.tileName}>{module.name}</Text>
      {module.tagline ? (
        <Text style={styles.tileTagline} numberOfLines={2}>
          {module.tagline}
        </Text>
      ) : null}
      {!available ? (
        <View style={styles.tileBadge}>
          <Badge label={module.status} />
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(5), paddingBottom: theme.space(12) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(3) },
  tile: {
    width: '47.5%',
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.md,
    padding: theme.space(4),
    minHeight: 150,
  },
  tilePressed: { opacity: 0.7 },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space(3),
  },
  tileName: { color: theme.color.text, fontSize: 15, fontWeight: '700' },
  tileTagline: { color: theme.color.muted, fontSize: 12, lineHeight: 18, marginTop: theme.space(1) },
  tileBadge: { marginTop: theme.space(3) },
})
