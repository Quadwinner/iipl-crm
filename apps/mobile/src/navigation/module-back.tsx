import { useNavigation } from '@react-navigation/native'
import { Pressable } from 'react-native'
import { ArrowLeft } from 'lucide-react-native'
import { useTheme } from '../theme/theme'

/**
 * Back out of a module, to the launcher that opened it.
 *
 * A module is pushed onto the root stack with the root's own header hidden, so
 * the first screen inside it has nothing to go back to within its own navigator
 * and React Navigation draws no arrow. Leaving the root header visible instead
 * is not the answer: the module's deeper screens carry their own headers, so
 * every one of them then shows two titles and two back arrows.
 *
 * One header, drawn by the module, with this as its way out.
 */
export function ModuleBack() {
  const navigation = useNavigation()
  const { theme } = useTheme()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to your apps"
      hitSlop={12}
      onPress={() => {
        const parent = navigation.getParent()
        if (parent?.canGoBack()) parent.goBack()
        else if (navigation.canGoBack()) navigation.goBack()
      }}
      style={({ pressed }) => [{ paddingRight: theme.space(4) }, pressed && { opacity: 0.6 }]}
    >
      <ArrowLeft size={22} color={theme.color.accent} />
    </Pressable>
  )
}
