import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import type { Service } from '@itoby/shared/site'
import { Enter } from '../../components/motion'
import { SectionHeader } from '../../components/section'
import { iconByName } from '../../lib/icons'
import { theme } from '../../theme/theme'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const ALL = 'All'

/** The four strings the CMS stores per service; anything else is ignored. */
function highlightsOf(service: Service): string[] {
  return Array.isArray(service.highlights)
    ? (service.highlights as unknown[]).filter((h): h is string => typeof h === 'string')
    : []
}

/**
 * Services, as something to work through rather than read.
 *
 * The section used to be four paragraphs stacked in cards — every service the
 * same weight, three lines of prose each, nothing to do. The CMS already stores
 * a category, an icon and four highlights per service and none of it was being
 * used.
 *
 * So: filter by category, then tap a service to open it. Only one is open at a
 * time, which keeps the section short enough to scan and makes opening one feel
 * like a choice.
 */
export function ServicesSection({ services }: { services: Service[] }) {
  const navigation = useNavigation()
  const [category, setCategory] = useState<string>(ALL)
  const [openId, setOpenId] = useState<string | null>(null)

  const categories = useMemo(() => {
    const seen = new Set<string>()
    for (const service of services) if (service.category) seen.add(service.category)
    return [ALL, ...seen]
  }, [services])

  const visible = useMemo(
    () => (category === ALL ? services : services.filter((s) => s.category === category)),
    [services, category],
  )

  function toggle(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'))
    setOpenId((current) => (current === id ? null : id))
  }

  if (services.length === 0) return null

  return (
    <View style={styles.section}>
      <Enter>
        <SectionHeader eyebrow="What we do" title="Services" />
      </Enter>

      {categories.length > 2 ? (
        <Enter delay={80}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {categories.map((name) => {
              const active = name === category
              return (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'),
                    )
                    setCategory(name)
                    setOpenId(null)
                  }}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
                </Pressable>
              )
            })}
          </ScrollView>
        </Enter>
      ) : null}

      {visible.map((service, index) => (
        <Enter key={service.id} delay={120 + index * 60}>
          <ServiceRow
            service={service}
            open={openId === service.id}
            onToggle={() => toggle(service.id)}
            onOpen={() => navigation.navigate('ServiceDetail', { slug: service.slug })}
          />
        </Enter>
      ))}
    </View>
  )
}

function ServiceRow({
  service,
  open,
  onToggle,
  onOpen,
}: {
  service: Service
  open: boolean
  onToggle: () => void
  onOpen: () => void
}) {
  const Icon = iconByName(service.icon)
  const spin = useRef(new Animated.Value(0)).current
  const highlights = highlightsOf(service)

  // In an effect, not in render: starting an animation during render fires it on
  // every re-render and fights itself.
  useEffect(() => {
    Animated.timing(spin, {
      toValue: open ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [open, spin])

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, open && styles.rowOpen, pressed && styles.pressed]}
    >
      <View style={styles.head}>
        <View style={[styles.iconTile, open && styles.iconTileOpen]}>
          <Icon size={20} color={open ? theme.color.accentText : theme.color.accent} />
        </View>

        <View style={styles.headText}>
          <Text style={styles.title}>{service.title}</Text>
          {service.category ? <Text style={styles.category}>{service.category}</Text> : null}
        </View>

        <Animated.View
          style={{
            transform: [
              { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) },
            ],
          }}
        >
          <ChevronDown size={20} color={theme.color.muted} />
        </Animated.View>
      </View>

      {open ? (
        <View style={styles.body}>
          {service.summary ? <Text style={styles.summary}>{service.summary}</Text> : null}

          {highlights.map((highlight) => (
            <View key={highlight} style={styles.highlight}>
              <View style={styles.bullet} />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}

          <Text style={styles.more} onPress={onOpen}>
            Read the full service →
          </Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  section: { marginBottom: theme.space(8), paddingHorizontal: theme.space(5) },
  filters: { gap: theme.space(2), paddingBottom: theme.space(4), paddingRight: theme.space(5) },
  chip: {
    borderColor: theme.color.border,
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(2),
  },
  chipActive: { backgroundColor: theme.color.accent, borderColor: theme.color.accent },
  chipText: { color: theme.color.muted, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: theme.color.accentText, fontWeight: '800' },
  row: {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(4),
    marginBottom: theme.space(3),
  },
  rowOpen: { borderColor: theme.color.accent },
  pressed: { opacity: 0.75 },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.space(3) },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surfaceAlt,
  },
  iconTileOpen: { backgroundColor: theme.color.accent },
  headText: { flex: 1 },
  title: { color: theme.color.text, fontSize: 15, fontWeight: '700' },
  category: {
    color: theme.color.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  body: { marginTop: theme.space(4), paddingLeft: theme.space(1) },
  summary: { color: theme.color.muted, fontSize: 14, lineHeight: 21, marginBottom: theme.space(4) },
  highlight: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space(3), marginBottom: theme.space(2) },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.color.accent,
    marginTop: 7,
  },
  highlightText: { color: theme.color.text, fontSize: 13, lineHeight: 20, flex: 1 },
  more: {
    color: theme.color.accent,
    fontSize: 13,
    fontWeight: '700',
    marginTop: theme.space(4),
  },
})
