import { useEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  HERO_EYEBROW,
  HERO_ROTATING,
  readProcess,
  readStats,
  type AppModule,
} from '@itoby/shared/site'
import { Badge, Button, Card } from '../../components/ui'
import { SectionHeader } from '../../components/section'
import { iconByName } from '../../lib/icons'
import { usePublicModules, useServices, useSiteSettings } from '../../features/site'
import { theme } from '../../theme/theme'

/**
 * The company home page, section for section with the website's:
 * hero + stats, services, products, industries pointer, process, contact CTA.
 * Every string comes from the CMS — nothing is hardcoded here.
 */
export function HomeScreen() {
  const navigation = useNavigation()
  const settings = useSiteSettings()
  const services = useServices()
  const modules = usePublicModules()

  // The website's hero cycles the thing being built; a timer is the RN equivalent
  // of its CSS keyframes.
  const [word, setWord] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setWord((n) => (n + 1) % HERO_ROTATING.length), 3000)
    return () => clearInterval(timer)
  }, [])

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
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{HERO_EYEBROW}</Text>
        <Text style={styles.heroTitle}>
          We build{'\n'}high-converting{'\n'}
          <Text style={styles.heroAccent}>{HERO_ROTATING[word]}</Text>
        </Text>
        {settings.data?.intro ? <Text style={styles.heroBody}>{settings.data.intro}</Text> : null}

        <View style={styles.heroActions}>
          <Button label="Start a project" onPress={() => navigation.navigate('Contact')} />
          <Button label="See our work" variant="ghost" onPress={() => navigation.navigate('Services')} />
        </View>
      </View>

      {stats.length > 0 ? (
        <View style={styles.stats}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text style={styles.statValue}>
                {stat.value}
                <Text style={styles.statSuffix}>{stat.suffix}</Text>
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader eyebrow="What we do" title="Services" />
        {(services.data ?? []).slice(0, 4).map((service) => (
          <Card key={service.id}>
            <Text style={styles.cardTitle}>{service.title}</Text>
            {service.summary ? <Text style={styles.cardBody}>{service.summary}</Text> : null}
          </Card>
        ))}
        {services.data && services.data.length > 4 ? (
          <Button label="All services" variant="ghost" onPress={() => navigation.navigate('Services')} />
        ) : null}
      </View>

      <View style={styles.section}>
        <SectionHeader eyebrow="Our products" title="One account, every tool" />
        {(modules.data ?? []).map((module) => (
          <ProductCard key={module.id} module={module} />
        ))}
      </View>

      {process.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader eyebrow="How we work" title="Process" />
          {process.map((step) => (
            <Card key={step.title}>
              <Text style={styles.stepNumber}>{step.step}</Text>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardBody}>{step.body}</Text>
            </Card>
          ))}
        </View>
      ) : null}

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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(5), paddingBottom: theme.space(12) },
  hero: { paddingTop: theme.space(4), paddingBottom: theme.space(8) },
  eyebrow: {
    color: theme.color.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: theme.color.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 40,
    marginTop: theme.space(3),
  },
  heroAccent: { color: theme.color.accent },
  heroBody: { color: theme.color.muted, fontSize: 15, lineHeight: 24, marginTop: theme.space(4) },
  heroActions: { gap: theme.space(3), marginTop: theme.space(7) },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space(5),
    marginBottom: theme.space(8),
  },
  stat: { width: '50%', paddingVertical: theme.space(2) },
  statValue: { color: theme.color.accent, fontSize: 24, fontWeight: '800' },
  statSuffix: { fontSize: 16 },
  statLabel: { color: theme.color.muted, fontSize: 12, marginTop: theme.space(1) },
  section: { marginBottom: theme.space(8) },
  cardTitle: { color: theme.color.text, fontSize: 16, fontWeight: '700' },
  cardTagline: { color: theme.color.accent, fontSize: 12, marginTop: 2 },
  cardBody: { color: theme.color.muted, fontSize: 14, lineHeight: 21, marginTop: theme.space(2) },
  stepNumber: {
    color: theme.color.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: theme.space(1),
  },
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
  },
  ctaTitle: { color: theme.color.text, fontSize: 20, fontWeight: '800' },
  ctaAction: { marginTop: theme.space(5) },
})
