import {
  Bot,
  BrainCircuit,
  Building2,
  Code2,
  Factory,
  Globe,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers,
  LayoutGrid,
  Mail,
  MessagesSquare,
  PhoneCall,
  ReceiptIndianRupee,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
  type LucideIcon,
} from 'lucide-react'

/**
 * Icon names are stored as text in the database so content editors can change
 * them without a deploy. Resolving through an explicit registry keeps the
 * bundle tree-shakeable and means an unknown name degrades to a sensible
 * default rather than crashing the page.
 */
const REGISTRY: Record<string, LucideIcon> = {
  Bot,
  BrainCircuit,
  Building2,
  Code2,
  Factory,
  Globe,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers,
  LayoutGrid,
  Mail,
  MessagesSquare,
  PhoneCall,
  ReceiptIndianRupee,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Truck,
}

export function iconByName(name: string | null | undefined, fallback: LucideIcon = Sparkles) {
  if (!name) return fallback
  return REGISTRY[name] ?? fallback
}
