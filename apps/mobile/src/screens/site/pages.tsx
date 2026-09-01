import { useRoute } from '@react-navigation/native'
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Badge, Card, Empty, ErrorState, Loading } from '../../components/ui'
import { LeadForm } from '../../components/lead-form'
import { SectionHeader } from '../../components/section'
import { iconByName } from '../../lib/icons'
import { useIndustries, usePublicModules, useServices, useSiteSettings } from '../../features/site'
import { theme } from '../../theme/theme'

/** The company story, straight from the CMS. */
export function AboutScreen() {
  const settings = useSiteSettings()
  const s = settings.data

  if (settings.isPending) return <Loading />
  if (settings.error) return <ErrorState error={settings.error} onRetry={() => void settings.refetch()} />

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader eyebrow="About" title={s?.company_name || 'Itoby Infotech'} body={s?.tagline} />
      {s?.intro ? <Text style={styles.prose}>{s.intro}</Text> : null}

      <View style={styles.block}>
        <SectionHeader title="Reach us" />
        {s?.email ? <ContactRow label="Email" value={s.email} href={`mailto:${s.email}`} /> : null}
        {s?.phone ? <ContactRow label="Phone" value={s.phone} href={`tel:${s.phone}`} /> : null}
        {s?.address ? <ContactRow label="Address" value={s.address} /> : null}
        {s?.business_hours ? <ContactRow label="Hours" value={s.business_hours} /> : null}
      </View>
    </ScrollView>
  )
}

export function ServicesScreen() {
  const services = useServices()

  if (services.isPending) return <Loading />
  if (services.error) return <ErrorState error={services.error} onRetry={() => void services.refetch()} />

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader eyebrow="What we do" title="Services" />
      {services.data?.length === 0 ? <Empty title="No services published yet" /> : null}
      {(services.data ?? []).map((service) => (
        <Card key={service.id}>
          {service.category ? <Text style={styles.kicker}>{service.category}</Text> : null}
          <Text style={styles.cardTitle}>{service.title}</Text>
          {service.summary ? <Text style={styles.cardBody}>{service.summary}</Text> : null}
          {Array.isArray(service.highlights) && service.highlights.length > 0 ? (
            <View style={styles.bullets}>
              {(service.highlights as unknown[])
                .filter((h): h is string => typeof h === 'string')
                .map((highlight) => (
                  <Text key={highlight} style={styles.bullet}>
                    · {highlight}
                  </Text>
                ))}
            </View>
          ) : null}
        </Card>
      ))}
    </ScrollView>
  )
}

/** Long-form copy for one service, matched by slug the way the web route does. */
export function ServiceDetailScreen() {
  const route = useRoute<{ key: string; name: string; params: { slug: string } }>()
  const services = useServices()
  const service = (services.data ?? []).find((row) => row.slug === route.params.slug)

  if (services.isPending) return <Loading />
  if (!service) return <Empty title="That service was not found" hint="It may have been unpublished." />

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader eyebrow={service.category || 'Service'} title={service.title} body={service.summary} />
      {service.body ? <Text style={styles.prose}>{service.body}</Text> : null}
    </ScrollView>
  )
}

export function IndustriesScreen() {
  const industries = useIndustries()

  if (industries.isPending) return <Loading />
  if (industries.error) {
    return <ErrorState error={industries.error} onRetry={() => void industries.refetch()} />
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader eyebrow="Who we serve" title="Industries" />
      {industries.data?.length === 0 ? <Empty title="No industries published yet" /> : null}
      {(industries.data ?? []).map((industry) => (
        <Card key={industry.id}>
          <Text style={styles.cardTitle}>{industry.name}</Text>
          {industry.summary ? <Text style={styles.cardBody}>{industry.summary}</Text> : null}
        </Card>
      ))}
    </ScrollView>
  )
}

/** The product catalogue — the same rows the launcher shows, minus the role filter. */
export function ProductsScreen() {
  const modules = usePublicModules()

  if (modules.isPending) return <Loading />
  if (modules.error) return <ErrorState error={modules.error} onRetry={() => void modules.refetch()} />

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader eyebrow="Our products" title="One account, every tool" />
      {(modules.data ?? []).map((module) => {
        const Icon = iconByName(module.icon)
        const features = Array.isArray(module.features)
          ? (module.features as unknown[]).filter((f): f is string => typeof f === 'string')
          : []
        return (
          <Card key={module.id}>
            <View style={styles.productHead}>
              <View style={[styles.productIcon, { backgroundColor: `${module.accent}22` }]}>
                <Icon size={20} color={module.accent} />
              </View>
              <View style={styles.productTitles}>
                <Text style={styles.cardTitle}>{module.name}</Text>
                {module.tagline ? <Text style={styles.kickerAccent}>{module.tagline}</Text> : null}
              </View>
            </View>
            {module.summary ? <Text style={styles.cardBody}>{module.summary}</Text> : null}
            {features.length > 0 ? (
              <View style={styles.bullets}>
                {features.map((feature) => (
                  <Text key={feature} style={styles.bullet}>
                    · {feature}
                  </Text>
                ))}
              </View>
            ) : null}
            <View style={styles.badgeRow}>
              <Badge label={module.status} />
            </View>
          </Card>
        )
      })}
    </ScrollView>
  )
}

export function ContactScreen() {
  const settings = useSiteSettings()
  const s = settings.data

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader
        eyebrow="Contact"
        title="Tell us what you're building"
        body="We read everything that comes in and reply within one business day."
      />

      {s?.email ? <ContactRow label="Email" value={s.email} href={`mailto:${s.email}`} /> : null}
      {s?.phone ? <ContactRow label="Phone" value={s.phone} href={`tel:${s.phone}`} /> : null}
      {s?.whatsapp ? (
        <ContactRow label="WhatsApp" value={s.whatsapp} href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`} />
      ) : null}

      <View style={styles.block}>
        <LeadForm source="CONTACT_FORM" cta="Send message" />
      </View>
    </ScrollView>
  )
}

export function QuoteScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SectionHeader
        eyebrow="Request a quote"
        title="Scope, timeline, budget"
        body="Give us the shape of the work and we'll come back with a plan and a number."
      />
      <LeadForm source="QUOTE_REQUEST" cta="Request quote" />
    </ScrollView>
  )
}

function ContactRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <View style={styles.contactRow}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[styles.contactValue, href && styles.link]}
        onPress={href ? () => void Linking.openURL(href) : undefined}
      >
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space(5), paddingBottom: theme.space(12) },
  block: { marginTop: theme.space(8) },
  prose: { color: theme.color.muted, fontSize: 15, lineHeight: 24 },
  kicker: {
    color: theme.color.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: theme.space(1),
  },
  kickerAccent: { color: theme.color.accent, fontSize: 12, marginTop: 2 },
  cardTitle: { color: theme.color.text, fontSize: 16, fontWeight: '700' },
  cardBody: { color: theme.color.muted, fontSize: 14, lineHeight: 21, marginTop: theme.space(2) },
  bullets: { marginTop: theme.space(3), gap: theme.space(1) },
  bullet: { color: theme.color.muted, fontSize: 13, lineHeight: 20 },
  badgeRow: { marginTop: theme.space(3) },
  productHead: { flexDirection: 'row', alignItems: 'center', gap: theme.space(3) },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productTitles: { flexShrink: 1 },
  contactRow: { marginBottom: theme.space(4) },
  label: { color: theme.color.muted, fontSize: 12, marginBottom: 2 },
  contactValue: { color: theme.color.text, fontSize: 15 },
  link: { color: theme.color.accent },
})
