import {
  Bot,
  BrainCircuit,
  Building2,
  Code2,
  Globe,
  Layers,
  LayoutGrid,
  Mail,
  MessagesSquare,
  PhoneCall,
  ReceiptIndianRupee,
  ScrollText,
  Smartphone,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native'

/**
 * `app_modules.icon` and `service_offerings.icon` hold a lucide icon name chosen
 * in the CMS. Only the icons actually referenced are imported — pulling the whole
 * lucide set into a mobile bundle costs far more than it returns. An unknown name
 * falls back rather than crashing, so adding a row in the CMS can never break a
 * screen; it just renders the generic tile until the name is added here.
 */
const ICONS: Record<string, LucideIcon> = {
  // Modules
  Building2,
  Target,
  ReceiptIndianRupee,
  ScrollText,
  PhoneCall,
  LayoutGrid,
  // Services
  Globe,
  Smartphone,
  Code2,
  Layers,
  BrainCircuit,
  Bot,
  MessagesSquare,
  TrendingUp,
  Mail,
}

export function iconByName(name: string | null | undefined): LucideIcon {
  return (name && ICONS[name]) || LayoutGrid
}
