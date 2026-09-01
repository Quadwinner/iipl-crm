import { useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { RootParamList } from '../navigation/types'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Badge, Card, Empty, Loading } from '../components/ui'
import { SectionHeader } from '../components/section'
import { iconByName } from '../lib/icons'
import { usePublicModules } from '../features/site'
import { useStyles, type Theme } from '../theme/theme'

/**
 * Registered-but-unbuilt modules render from their own app_modules row, so
 * adding a product to the CMS gives it a real page here without a release.
 */
export function ModuleComingSoonScreen() {
  const styles = useStyles(makeStyles)
  const route = useRoute<RouteProp<RootParamList, 'ModuleComingSoon'>>()
  const modules = usePublicModules()
  const module = (modules.data ?? []).find((row) => row.key === route.params.moduleKey)

  if (modules.isPending) return <Loading />
  if (!module) return <Empty title="That product was not found" />

  const Icon = iconByName(module.icon)
  const features = Array.isArray(module.features)
    ? (module.features as unknown[]).filter((f): f is string => typeof f === 'string')
    : []

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.icon, { backgroundColor: `${module.accent}22` }]}>
        <Icon size={28} color={module.accent} />
      </View>
      <SectionHeader title={module.name} body={module.summary || module.tagline} />
      <Badge label={module.status} />

      {features.length > 0 ? (
        <Card>
          <Text style={styles.cardTitle}>What it will do</Text>
          <View style={styles.bullets}>
            {features.map((feature) => (
              <Text key={feature} style={styles.bullet}>
                · {feature}
              </Text>
            ))}
          </View>
        </Card>
      ) : null}
    </ScrollView>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(5), paddingBottom: theme.space(12) },
  icon: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space(5),
  },
  cardTitle: { color: theme.color.text, fontSize: 15, fontWeight: '700' },
  bullets: { marginTop: theme.space(3), gap: theme.space(2) },
  bullet: { color: theme.color.muted, fontSize: 14, lineHeight: 21 },
})
