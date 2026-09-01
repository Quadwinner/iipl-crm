import {
  Building2,
  LayoutGrid,
  PhoneCall,
  ReceiptIndianRupee,
  ScrollText,
  Target,
  type LucideIcon,
} from 'lucide-react-native'

/**
 * app_modules.icon holds a lucide icon name chosen in the CMS. Only the icons
 * actually referenced are imported — pulling the whole lucide set into a mobile
 * bundle costs far more than it returns. An unknown name falls back rather than
 * crashing, so adding a module in the CMS can never break the launcher.
 */
const ICONS: Record<string, LucideIcon> = {
  Building2,
  Target,
  ReceiptIndianRupee,
  ScrollText,
  PhoneCall,
  LayoutGrid,
}

export function iconByName(name: string | null | undefined): LucideIcon {
  return (name && ICONS[name]) || LayoutGrid
}
