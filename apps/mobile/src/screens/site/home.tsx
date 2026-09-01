import { useNavigation } from '@react-navigation/native'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { readProcess, readStats, type AppModule } from '@itoby/shared/site'
import { Badge, Button, Card } from '../../components/ui'
import { SectionHeader } from '../../components/section'
import { Hero } from './hero'
import { ProcessSection } from './process-section'
import { ServicesSection } from './services-section'
import { iconByName } from '../../lib/icons'
import { usePublicModules, useServices, useSiteSettings } from '../../features/site'
import { useStyles, useTheme, type Theme } from '../../theme/theme'

/**
 * The company home page, section for section with the website's:
 * hero + stats, services, products, industries pointer, process, contact CTA.
 * Every string comes from the CMS — nothing is hardcoded here.
 */
export function HomeScreen() {
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)
  const navigation = useNavigation()
  const settings = useSiteSettings()
  const services = useServices()
  const modules = usePublicModules()

  const stats = readStats(settings.data)
  const process = readProcess(settings.data)
  const refreshing = settings.isRefetching || services.isRefetching || modules.isRefetching

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={theme.color.accent}
          onRefresh={() => {
            void settings.refetch()
            void services.refetch()
            void modules.refetch()
          }}
        />
      }
    >
      <Hero
        intro={settings.data?.intro ?? ''}
        stats={stats}
        modules={modules.data ?? []}
        onStart={() => navigation.navigate('Contact')}
        onExplore={() => navigation.navigate('Services')}
      />

      <ServicesSection services={services.data ?? []} />

      <View style={styles.section}>
        <SectionHeader eyebrow="Our products" title="One account, every tool" />
        {(modules.data ?? []).map((module) => (
          <ProductCard key={module.id} module={module} />
        ))}
      </View>

      <ProcessSection steps={process} />

      <View style={styles.cta}>
        <Text style={styles.ctaTitle}>Have something in mind?</Text>
        <Text style={styles.cardBody}>Tell us about it — we reply within one business day.</Text>
        <View style={styles.ctaAction}>
          <Button label="Get in touch" onPress={() => navigation.navigate('Contact')} />
        </View>
      </View>
    </ScrollView>
  )
}

function ProductCard({ module }: { module: AppModule }) {
  const styles = useStyles(makeStyles)
  const Icon = iconByName(module.icon)
  return (
    <Card>
      <View style={styles.productHead}>
        <View style={[styles.productIcon, { backgroundColor: `${module.accent}22` }]}>
          <Icon size={20} color={module.accent} />
        </View>
        <View style={styles.productTitles}>
          <Text style={styles.cardTitle}>{module.name}</Text>
          {module.tagline ? <Text style={styles.cardTagline}>{module.tagline}</Text> : null}
        </View>
      </View>
      {module.summary ? <Text style={styles.cardBody}>{module.summary}</Text> : null}
      {module.status !== 'ACTIVE' ? (
        <View style={styles.productBadge}>
          <Badge label={module.status} />
        </View>
      ) : null}
    </Card>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { paddingBottom: theme.space(12) },
  section: { marginBottom: theme.space(8), paddingHorizontal: theme.space(5) },
  cardTitle: { color: theme.color.text, fontSize: 16, fontWeight: '700' },
  cardTagline: { color: theme.color.accent, fontSize: 12, marginTop: 2 },
  cardBody: { color: theme.color.muted, fontSize: 14, lineHeight: 21, marginTop: theme.space(2) },
  productHead: { flexDirection: 'row', alignItems: 'center', gap: theme.space(3) },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTitles: { flexShrink: 1 },
  productBadge: { marginTop: theme.space(3) },
  cta: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space(6),
    marginHorizontal: theme.space(5),
  },
  ctaTitle: { color: theme.color.text, fontSize: 20, fontWeight: '800' },
  ctaAction: { marginTop: theme.space(5) },
})
