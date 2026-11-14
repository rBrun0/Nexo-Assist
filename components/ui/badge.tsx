import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const SUCCESS = "#00BD6B"
const PRIMARY = "#0285F7"
const CYAN = "#06B6D4"
const WARNING = "#F5A300"
const MUTED = "#94A3B8"
const ROSE = "#F43F5E"

/** Aliases semânticos → mesma hex. Lookup em minúsculas em generatePastelColors. */
const knownColors: Record<string, string> = {
  // Success / confiança alta / resolvido
  active: SUCCESS,
  positive: SUCCESS,
  online: SUCCESS,
  success: SUCCESS,
  green: SUCCESS,
  high: SUCCESS,
  alto: SUCCESS,
  resolved: SUCCESS,
  resolvido: SUCCESS,
  approved: SUCCESS,
  aprovado: SUCCESS,
  bot_active: SUCCESS,
  // Warning / confiança média / fila humana
  warning: WARNING,
  amber: WARNING,
  medium: WARNING,
  médio: WARNING,
  medio: WARNING,
  waiting_human: WARNING,
  human_active: WARNING,
  waiting_analyst: WARNING,
  "aguardando analista": WARNING,
  "agente pausado": WARNING,
  alta: WARNING,
  média: WARNING,
  media: WARNING,
  // Primary / aberto / suporte
  primary: PRIMARY,
  blue: PRIMARY,
  open: PRIMARY,
  aberto: PRIMARY,
  in_progress: PRIMARY,
  "em andamento": PRIMARY,
  "suporte n1": PRIMARY,
  "suporte n2": PRIMARY,
  "suporte n3": PRIMARY,
  "coordenação de service desk": PRIMARY,
  "coordenacao de service desk": PRIMARY,
  cyan: CYAN,
  // Muted / prioridade baixa / encerrado
  muted: MUTED,
  baixa: MUTED,
  closed: MUTED,
  fechado: MUTED,
  "conversa encerrada": MUTED,
  encerrada: MUTED,
  // Rose / confiança baixa / crítico
  low: ROSE,
  baixo: ROSE,
  critical: ROSE,
  crítica: ROSE,
  critica: ROSE,
  danger: ROSE,
  error: ROSE,
  destructive: ROSE,
  rose: ROSE,
  red: ROSE,
}

function getHueFromHex(hex: string) {
  const red = parseInt(hex.slice(1, 3), 16) / 255
  const green = parseInt(hex.slice(3, 5), 16) / 255
  const blue = parseInt(hex.slice(5, 7), 16) / 255
  const maximum = Math.max(red, green, blue)
  const minimum = Math.min(red, green, blue)
  const delta = maximum - minimum

  if (delta === 0) return 0

  const hue =
    maximum === red
      ? ((green - blue) / delta) % 6
      : maximum === green
        ? (blue - red) / delta + 2
        : (red - green) / delta + 4

  return Math.round(hue * 60 + (hue < 0 ? 360 : 0))
}

export function generatePastelColors(text: string) {
  let hash = 0

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0
  }

  const knownColor = knownColors[text.trim().toLowerCase()]
  const hue = knownColor ? getHueFromHex(knownColor) : Math.abs(hash) % 360

  return {
    backgroundColor: `hsl(${hue} 75% 94%)`,
    color: `hsl(${hue} 45% 30%)`,
    borderColor: `hsl(${hue} 55% 84%)`,
  }
}

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  pastelFromText,
  style,
  ...props
}: useRender.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    pastelFromText?: string
  }) {
  const pastelColors = pastelFromText
    ? generatePastelColors(pastelFromText)
    : undefined

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
        style: pastelColors ? { ...pastelColors, ...style } : style,
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
