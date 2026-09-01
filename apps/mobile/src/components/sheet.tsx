import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Button } from './ui'
import { useStyles, useTheme, type Theme } from '../theme/theme'

/**
 * A confirmation the app owns, rather than the operating system's.
 *
 * Alert.alert renders the platform dialog — grey on Android, its own type, its
 * own button colours — which lands in the middle of a themed screen looking
 * like it belongs to something else. This is the same message in the app's
 * surface, border and accent, and it follows the light/dark setting.
 */
export function Sheet({
  visible,
  title,
  body,
  cta = 'OK',
  tone = 'default',
  onClose,
}: {
  visible: boolean
  title: string
  body?: string
  cta?: string
  /** `success` tints the title with the accent; failures stay neutral. */
  tone?: 'default' | 'success'
  onClose: () => void
}) {
  const styles = useStyles(makeStyles)
  const { theme } = useTheme()

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Tapping outside dismisses, which the platform dialog does not do and
          people reach for anyway. */}
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View
            style={[
              styles.rule,
              { backgroundColor: tone === 'success' ? theme.color.ok : theme.color.accent },
            ]}
          />
          <Text style={styles.title}>{title}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}
          <View style={styles.action}>
            <Button label={cta} onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    scrim: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      padding: theme.space(6),
    },
    sheet: {
      backgroundColor: theme.color.surface,
      borderColor: theme.color.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: theme.radius.lg,
      padding: theme.space(6),
      overflow: 'hidden',
    },
    rule: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
    },
    title: { color: theme.color.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
    body: { color: theme.color.muted, fontSize: 14, lineHeight: 22, marginTop: theme.space(3) },
    action: { marginTop: theme.space(6) },
  })
