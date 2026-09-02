import { useNavigation } from '@react-navigation/native'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { readProcess, readStats, type AppModule } from '@itoby/shared/site'
import { useAuth } from '../../auth/auth'
import { Enter } from '../../components/motion'
import { SectionHead } from '../../components/section'
import { iconByName } from '../../lib/icons'
import { useIndustries, usePublicModules, useServices, useSiteSettings } from '../../features/site'
import { useStyles, useTheme, type Theme } from '../../theme/theme'
import { AppsGrid, shortModuleName } from './apps-grid'
import { BrandBand } from './brand-band'
import { AboutSection, ContactSection, IndustriesSection } from './info-sections'
import { ProcessSection } from './process-section'
import { ServicesSection } from './services-section'

/**
 * The home screen, shaped like a superapp rather than a landing page.
 *
 * The order is the argument. Every superapp that works — Paytm, PhonePe, Google
 * Pay, Gojek, Alipay — opens on a grid of things you can tap, inside the first
 * screenful, under at most one short band of brand. None of them put the
 * company's story above the services, and none of them give that story a
 * treatment of its own when they carry it at all.
 *
 * So: one brand band, then the apps, then the one product that is actually
 * live, then Itoby's own sections in the same cards and at the same type size
 * as everything above them. What used to be here — a full-height hero with
 * display type and two buttons, then the products as a stack of paragraphs —
 * is the shape of a website, and read as one.
 *
 * Every string still comes from the CMS. Nothing is hardcoded here.
 */
export function HomeScreen() {
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)
  const navigation = useNavigation()
  const { status } = useAuth()
  const settings = useSiteSettings()
  const services = useServices()
  const industries = useIndustries()
  const modules = usePublicModules()

  const stats = readStats(settings.data)
  const process = readProcess(settings.data)
  const list = modules.data ?? []
  const live = list.find((module) => module.status === 'ACTIVE')
  const refreshing =
    settings.isRefetching || services.isRefetching || modules.isRefetching || industries.isRefetching

  /**
   * One place decides what a product tile does, so the grid and the spotlight
   * card can never disagree. Signed out, an available product routes to sign-in
   * rather than to a screen that would immediately bounce; anything unbuilt
   * goes to its own page, which renders from its app_modules row.
   */
  function openModule(module: AppModule) {
    if (module.status !== 'ACTIVE') {
      navigation.navigate('ModuleComingSoon', { moduleKey: module.key })
      return
    }
    if (status !== 'authenticated') {
      navigation.navigate('SignIn')
      return
    }
    if (module.key === 'rental') navigation.navigate('Rental')
    else navigation.navigate('ModuleComingSoon', { moduleKey: module.key })
  }

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
            void industries.refetch()
          }}
        />
      }
    >
      <BrandBand stats={stats} />

      {list.length > 0 ? (
        <View style={styles.section}>
          <Enter>
            <SectionHead
              title="Our apps"
              actionLabel="All products"
              onAction={() => navigation.navigate('Products')}
            />
          </Enter>
          <View style={styles.card}>
            <AppsGrid modules={list} onOpen={openModule} />
          </View>
        </View>
      ) : null}

      {live ? (
        <Spotlight
          module={live}
          signedIn={status === 'authenticated'}
          onOpen={() => openModule(live)}
        />
      ) : null}

      <ServicesSection services={services.data ?? []} />

      <IndustriesSection
        industries={industries.data ?? []}
        onSeeAll={() => navigation.navigate('Industries')}
      />

      <ProcessSection steps={process} />

      <AboutSection settings={settings.data} onOpen={() => navigation.navigate('About')} />

      <ContactSection settings={settings.data} onEnquire={() => navigation.navigate('Contact')} />
    </ScrollView>
  )
}

/**
 * The one product that can actually be opened today.
 *
 * Four of the five tiles lead to a coming-soon page, which makes the grid alone
 * a poor front door — nothing in it says where to start. This card is that
 * answer, and it disappears on its own once the CMS marks a second product
 * live, because it renders whichever row is ACTIVE rather than a hardcoded one.
 */
function Spotlight({
  module,
  signedIn,
  onOpen,
}: {
  module: AppModule
  signedIn: boolean
  onOpen: () => void
}) {
  const styles = useStyles(makeStyles)
  const Icon = iconByName(module.icon)

  return (
    <View style={styles.section}>
      <Enter delay={120}>
        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          style={({ pressed }) => [styles.spotlight, pressed && styles.pressed]}
        >
          <View style={styles.spotHead}>
            <View style={[styles.spotIcon, { backgroundColor: `${module.accent}22` }]}>
              <Icon size={22} color={module.accent} />
            </View>
            <View style={styles.spotTitles}>
              <Text style={styles.spotName}>{module.name}</Text>
              <View style={styles.liveRow}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live now</Text>
              </View>
            </View>
          </View>

          {module.tagline ? (
            <Text style={styles.spotBody} numberOfLines={2}>
              {module.tagline}
            </Text>
          ) : null}

          <View style={styles.spotCta}>
            <Text style={styles.spotCtaText}>
              {signedIn ? `Open ${shortModuleName(module.name)}` : 'Sign in to open'}
            </Text>
          </View>
        </Pressable>
      </Enter>
    </View>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.color.bg },
    content: { paddingBottom: theme.space(12) },
    section: { marginBottom: theme.space(8), paddingHorizontal: theme.space(5) },
    pressed: { opacity: 0.75 },

    card: {
      backgroundColor: theme.color.surface,
      borderColor: theme.color.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.md,
      paddingVertical: theme.space(5),
      paddingHorizontal: theme.space(2),
    },

    spotlight: {
      backgroundColor: theme.color.surface,
      borderColor: theme.color.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.md,
      padding: theme.space(4),
    },
    spotHead: { flexDirection: 'row', alignItems: 'center', gap: theme.space(3) },
    spotIcon: {
      width: 44,
      height: 44,
      borderRadius: theme.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    spotTitles: { flex: 1 },
    spotName: { color: theme.color.text, fontSize: 15, fontWeight: '800' },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.color.ok },
    liveText: { color: theme.color.ok, fontSize: 11, fontWeight: '700' },
    spotBody: {
      color: theme.color.muted,
      fontSize: 13,
      lineHeight: 20,
      marginTop: theme.space(3),
    },
    spotCta: {
      backgroundColor: theme.color.accent,
      borderRadius: theme.radius.sm,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.space(4),
    },
    spotCtaText: { color: theme.color.accentText, fontSize: 14, fontWeight: '800' },
  })
