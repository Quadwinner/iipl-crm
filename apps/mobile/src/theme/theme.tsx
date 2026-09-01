import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { palettes, radius, space, statusColorFor, type Palette, type SchemeName } from '@itoby/shared/theme'

const STORAGE_KEY = 'itoby:scheme'

/**
 * The app's design tokens for one scheme.
 *
 * Semantic names rather than palette names: screens ask for `surface`, not
 * `ink2`, so a scheme can change what a surface is without every screen
 * knowing. The palette itself lives in @itoby/shared so the app and the website
 * agree on the brand.
 */
export interface Theme {
  color: {
    bg: string
    surface: string
    surfaceAlt: string
    border: string
    text: string
    muted: string
    accent: string
    accentDim: string
    accentText: string
    cyan: string
    danger: string
    warn: string
    ok: string
  }
  radius: typeof radius
  space: typeof space
}

function build(palette: Palette): Theme {
  return {
    color: {
      bg: palette.ink,
      surface: palette.ink2,
      surfaceAlt: palette.ink3,
      border: palette.line,
      text: palette.fg,
      muted: palette.fg2,
      accent: palette.lime,
      accentDim: palette.limeDim,
      accentText: palette.onLime,
      cyan: palette.cyan,
      danger: palette.danger,
      warn: palette.warn,
      ok: palette.ok,
    },
    radius,
    space,
  }
}

const THEMES: Record<SchemeName, Theme> = {
  dark: build(palettes.dark),
  light: build(palettes.light),
}

/** `system` follows the OS; the other two are the user overriding it. */
export type SchemePreference = SchemeName | 'system'

interface ThemeValue {
  theme: Theme
  scheme: SchemeName
  preference: SchemePreference
  setPreference: (next: SchemePreference) => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const [preference, setStored] = useState<SchemePreference>('system')

  // Read the saved preference once. Until it arrives the app follows the OS,
  // which is the right guess and avoids a flash of the wrong scheme.
  useEffect(() => {
    let active = true
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!active) return
        if (value === 'light' || value === 'dark' || value === 'system') setStored(value)
      })
      .catch(() => {
        // A missing preference is not worth surfacing; the OS decides.
      })
    return () => {
      active = false
    }
  }, [])

  const setPreference = useCallback((next: SchemePreference) => {
    setStored(next)
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {})
  }, [])

  const scheme: SchemeName = preference === 'system' ? (system === 'light' ? 'light' : 'dark') : preference

  const value = useMemo<ThemeValue>(
    () => ({ theme: THEMES[scheme], scheme, preference, setPreference }),
    [scheme, preference, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>')
  return value
}

/**
 * Builds a screen's styles for the active theme, and rebuilds them only when
 * the theme actually changes.
 *
 * StyleSheet.create resolves its values once, so styles written at module scope
 * are frozen to whichever palette was imported and cannot follow a scheme
 * change. Passing a factory instead is what makes the toggle possible at all.
 */
export function useStyles<T>(factory: (theme: Theme) => T): T {
  const { theme } = useTheme()
  return useMemo(() => factory(theme), [factory, theme])
}

/** Status colour for the active theme. */
export function useStatusColor(): (status: string) => string {
  const { scheme } = useTheme()
  return useCallback((status: string) => statusColorFor(palettes[scheme], status), [scheme])
}

/** Dark-scheme tokens for the two places a hook cannot run: a class error
 *  boundary, and anything rendering before the provider mounts. */
export const staticTheme = THEMES.dark
