/**
 * ZenithPay Design System
 *
 * Extracted from globals.css and the landing/sign-in pages.
 * Dashboard MUST match these patterns — do not deviate.
 *
 * COLOR TOKENS (CSS variables, defined in globals.css)
 * --background       white / dark: deep blue-gray oklch(0.067 0.016 262)
 * --foreground       near-black / dark: near-white
 * --border           oklch(0.922 0 0) / dark: oklch(1 0 0 / 10%)
 * --muted-foreground mid-gray labels
 * --brand-accent     oklch(0.55 0.13 57) — amber/orange
 * --primary          oklch(0.205 0 0) — near-black button fills
 *
 * TYPOGRAPHY
 * --font-sans: Geist Sans — body text
 * --font-mono: Geist Mono — addresses, amounts, hashes, codes
 * --font-pixel-square: logo wordmark only
 * Label pattern: text-xs uppercase tracking-wider (e.g. "USDC BALANCE")
 * Amount pattern: font-mono text-2xl font-bold
 *
 * BORDER RADIUS (dashboard)
 * --radius: 0rem — everything is sharp (set via inline style in dashboard layout)
 * NO rounded-*: buttons, cards, badges, inputs, skeletons, popovers
 *
 * BORDERS
 * Solid border: border-border — primary separator
 * Dashed border: border-dashed border-border — secondary / metadata rows
 * Grid lines: used as background element, matches landing page ladder component
 *
 * BUTTON STYLE
 * variant="outline": sharp, border-based, not filled
 * variant="default": filled with primary color, sharp
 * No pill buttons anywhere
 *
 * STATUS COLORS (semantic, not from CSS vars)
 * approved:  border-emerald-600  bg-emerald-500/10  text-emerald-700
 * blocked:   border-red-600      bg-red-500/10      text-red-700
 * denied:    border-red-600      bg-red-500/10      text-red-700
 * pending:   border-amber-600    bg-amber-500/10    text-amber-700
 *
 * SPACING
 * Page padding: p-6
 * Card gap: gap-4
 * Row padding: py-3 (between border-dashed rows)
 * Section spacing: space-y-6
 *
 * CARD PATTERN
 * <Card className="rounded-none border">
 *   <CardHeader>
 *     <CardTitle className="text-sm font-medium uppercase tracking-wider">
 * Row pattern inside card:
 *   <div className="flex items-center justify-between border-b border-dashed py-3">
 *     <span className="text-xs text-muted-foreground uppercase tracking-wider">Label</span>
 *     <span className="text-xs font-mono">value</span>
 *   </div>
 */

export {}; // module marker
