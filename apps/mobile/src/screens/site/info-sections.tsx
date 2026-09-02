import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react-native'
import type { Industry, SiteSettings } from '@itoby/shared/site'
import { Enter } from '../../components/motion'
import { SectionHead } from '../../components/section'
import { useStyles, useTheme, type Theme } from '../../theme/theme'

/**
 * The company's own story, kept on the home screen but demoted to the same
 * treatment as everything else.
 *
 * The rule these follow: company content gets no styling of its own. Same card,
 * same heading size, same body size as the app sections above. The moment it
 * takes a background of its own or a bigger typeface it reads as an
 * advertisement, and the screen slides back into being a landing page. Each one
 * is a short summary that links out to the full page rather than the full page
 * inlined here.
 */

/** Who Itoby serves, as a chip cloud. Tapping any of them opens the full list. */
export function IndustriesSection({
  industries,
  onSeeAll,
}: {
  industries: Industry[]
  onSeeAll: () => void
}) {
  const styles = useStyles(makeStyles)
  if (industries.length === 0) return null

  return (
    <View style={styles.section}>
      <Enter>
        <SectionHead title="Who we serve" actionLabel="All" onAction={onSeeAll} />
      </Enter>
      <Enter delay={60}>
        <View style={styles.chips}>
          {industries.map((industry) => (
            <Pressable
              key={industry.id}
              accessibilityRole="button"
              onPress={onSeeAll}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              <Text style={styles.chipText}>{industry.name}</Text>
            </Pressable>
          ))}
        </View>
      </Enter>
    </View>
  )
}

/** The intro paragraph, three lines of it, linking to the full About screen. */
export function AboutSection({
  settings,
  onOpen,
}: {
  settings: SiteSettings | null | undefined
  onOpen: () => void
}) {
  const styles = useStyles(makeStyles)
  const { theme } = useTheme()
  if (!settings?.intro) return null

  return (
    <View style={styles.section}>
      <Enter>
        <SectionHead title={`About ${settings.company_name || 'Itoby'}`} />
      </Enter>
      <Enter delay={60}>
        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <Text style={styles.body} numberOfLines={3}>
            {settings.intro}
          </Text>
          <View style={styles.more}>
            <Text style={styles.moreText}>Read more</Text>
            <ChevronRight size={14} color={theme.color.accent} />
          </View>
        </Pressable>
      </Enter>
    </View>
  )
}

/**
 * How to reach Itoby, as tappable rows.
 *
 * Rows rather than a block of contact details: a phone number that does not
 * dial and an address that does not open is website copy pasted into an app.
 */
export function ContactSection({
  settings,
  onEnquire,
}: {
  settings: SiteSettings | null | undefined
  onEnquire: () => void
}) {
  const styles = useStyles(makeStyles)
  if (!settings) return null

  const whatsapp = settings.whatsapp?.replace(/[^\d]/g, '')

  return (
    <View style={styles.section}>
      <Enter>
        <SectionHead title="Talk to us" />
      </Enter>
      <Enter delay={60}>
        <View style={styles.card}>
          {settings.phone ? (
            <ContactRow
              icon={Phone}
              label="Call"
              value={settings.phone}
              href={`tel:${settings.phone.replace(/\s/g, '')}`}
            />
          ) : null}
          {whatsapp ? (
            <ContactRow
              icon={MessageCircle}
              label="WhatsApp"
              value="Message us"
              href={`https://wa.me/${whatsapp}`}
            />
          ) : null}
          {settings.email ? (
            <ContactRow
              icon={Mail}
              label="Email"
              value={settings.email}
              href={`mailto:${settings.email}`}
            />
          ) : null}
          {settings.address ? (
            <ContactRow icon={MapPin} label="Office" value={settings.address} />
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={onEnquire}
            style={({ pressed }) => [styles.enquire, pressed && styles.pressed]}
          >
            <Text style={styles.enquireText}>Send an enquiry</Text>
          </Pressable>
        </View>
      </Enter>
    </View>
  )
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Phone
  label: string
  value: string
  href?: string
}) {
  const { theme } = useTheme()
  const styles = useStyles(makeStyles)

  const body = (
    <>
      <View style={styles.rowIcon}>
        <Icon size={16} color={theme.color.accent} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
      {href ? <ChevronRight size={16} color={theme.color.muted} /> : null}
    </>
  )

  if (!href) return <View style={styles.row}>{body}</View>

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => void Linking.openURL(href)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {body}
    </Pressable>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    section: { marginBottom: theme.space(8), paddingHorizontal: theme.space(5) },
    pressed: { opacity: 0.65 },

    card: {
      backgroundColor: theme.color.surface,
      borderColor: theme.color.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.md,
      paddingHorizontal: theme.space(4),
      paddingVertical: theme.space(2),
    },
    body: {
      color: theme.color.muted,
      fontSize: 13.5,
      lineHeight: 21,
      marginTop: theme.space(2),
    },
    more: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginTop: theme.space(3),
      marginBottom: theme.space(2),
    },
    moreText: { color: theme.color.accent, fontSize: 13, fontWeight: '700' },

    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space(2) },
    chip: {
      backgroundColor: theme.color.surface,
      borderColor: theme.color.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.pill,
      paddingHorizontal: theme.space(3),
      paddingVertical: theme.space(2),
    },
    chipText: { color: theme.color.text, fontSize: 12.5, fontWeight: '600' },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.space(3),
      paddingVertical: theme.space(3),
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: theme.radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.color.surfaceAlt,
    },
    rowText: { flex: 1 },
    rowLabel: { color: theme.color.muted, fontSize: 11, fontWeight: '600' },
    rowValue: { color: theme.color.text, fontSize: 13.5, fontWeight: '600', marginTop: 1 },

    enquire: {
      backgroundColor: theme.color.accent,
      borderRadius: theme.radius.sm,
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: theme.space(3),
    },
    enquireText: { color: theme.color.accentText, fontSize: 14.5, fontWeight: '800' },
  })
