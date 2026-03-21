"use client"

import { ArrowRight, ArrowRightIcon } from "lucide-react"
import { motion } from "motion/react"
import Link from "next/link"
import { useConnection } from "wagmi"
import { ZenithDither } from "@/components/bg/zenith-dither"
import { LogoMark } from "@/components/logo-mark"
import { TechGrid } from "@/components/tech-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function HeroBadge() {
	return (
		<Badge
			className="mx-auto border transition-all duration-300 delay-100 flex items-center gap-2 cursor-pointer group [&>svg]:size-0 relative overflow-hidden"
			variant="outline"
			asChild
		>
			<Link href="/overview">
				<span className="shine absolute inset-0 bg-linear-to-r from-transparent via-white/60 to-transparent -translate-x-full" />
				<LogoMark className="size-3 animate-[spin_3s_linear_infinite]" />
				<p className="font-light font-pixel-square">Introducing ZenithPay</p>
				<ArrowRight className="-ml-2 size-0 opacity-0 group-hover:opacity-100 group-hover:size-3 group-hover:-ml-1 transition-all duration-300 delay-100" />
			</Link>
		</Badge>
	)
}

function GetStartedButton() {
	const { isConnected } = useConnection()

	return (
		<Button
			asChild
			style={{ background: "var(--brand-accent)", color: "var(--background)" }}
			className="rounded-none cursor-pointer relative overflow-hidden focus-visible:ring-0 h-9 px-4 hover:opacity-90 transition-opacity group"
		>
			<Link href={isConnected ? "/overview" : "/signin"}>
				<span className="shine absolute -top-1/2 -left-full h-[200%] w-3/4 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
				Get started
				<ArrowRightIcon className="size-4 w-0 opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-200" />
			</Link>
		</Button>
	)
}

function SeeHowItWorksButton() {
	return (
		<div className="relative w-fit group">
			<Button
				asChild
				variant="outline"
				className="rounded-none cursor-pointer relative overflow-hidden focus-visible:ring-0 h-9 px-4 border-dashed"
			>
				<a href="#how-it-works">
					<span className="shine absolute -top-1/2 -left-full h-[200%] w-3/4 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
					See how it works
					<ArrowRightIcon className="size-4 w-0 opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-200" />
				</a>
			</Button>
			<span className="absolute h-2 w-2 border-foreground border-b border-r bottom-0 right-0" />
			<span className="absolute h-2 w-2 border-foreground border-b border-l bottom-0 left-0" />
			<span className="absolute h-2 w-2 border-foreground border-t border-r top-0 right-0" />
			<span className="absolute h-2 w-2 border-foreground border-t border-l top-0 left-0" />
		</div>
	)
}

type TerminalLineType = "prompt" | "success" | "info" | "gap" | "cursor"

interface TerminalLine {
	type: TerminalLineType
	text?: string
}

const TERMINAL_LINES: TerminalLine[] = [
	{ type: "prompt", text: "zenithpay agent create --name bot-01" },
	{ type: "success", text: "✓ Wallet ready   0xcadf92…1a9" },
	{ type: "success", text: "✓ Chain: X Layer   Balance: 10.00 USDC" },
	{ type: "gap" },
	{
		type: "prompt",
		text: "zenithpay policy set --per-tx 5 --daily 50",
	},
	{ type: "success", text: "✓ SpendPolicy.sol   on-chain" },
	{ type: "success", text: "✓ Allowlist   set · OKB auto-swap enabled" },
	{ type: "gap" },
	{ type: "prompt", text: 'zenithpay pay --service exa "DeFi news"' },
	{ type: "info", text: "  checking policy · swapping OKB→USDC..." },
	{ type: "success", text: "✓ x402 payment   $0.007 USDC · 12 results" },
	{ type: "success", text: "✓ Logged on X Layer   block 9841203" },
	{ type: "cursor" },
]

function HeroTerminal() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
			className="w-full overflow-hidden border border-border sm:max-w-[480px]"
		>
			{/* macOS window chrome — no bg, minimal dots */}
			<div className="relative flex items-center px-3 h-8 border-b border-border">
				<div className="flex items-center gap-1.5">
					<span className="size-2 rounded-full bg-foreground/20" />
					<span className="size-2 rounded-full bg-foreground/20" />
					<span className="size-2 rounded-full bg-foreground/20" />
				</div>
				<span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-muted-foreground/50 pointer-events-none tracking-wide">
					terminal — zenith
				</span>
			</div>

			{/* Terminal body */}
			<div className="bg-[#0d0d0d] px-4 pt-3 pb-5 font-mono min-h-[300px]">
				<p className="text-[10px] text-white/20 mb-3 tracking-wide">
					Last login: Mon Mar 16 · <span className="text-white/30">zenith@xlayer</span>
				</p>

				{TERMINAL_LINES.map((line, i) => {
					if (line.type === "gap") {
						return <div key={i} className="h-2" />
					}

					if (line.type === "cursor") {
						return (
							<motion.div
								key={i}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.1 + i * 0.09, duration: 0.15 }}
								className="flex items-center gap-1 mt-1"
							>
								<span className="text-white/50 text-[11px]">zenith@xlayer ~</span>
								<span className="text-white/30 text-[11px]"> $</span>
								<span className="inline-block w-[7px] h-[13px] bg-white/50 ml-0.5 animate-pulse" />
							</motion.div>
						)
					}

					return (
						<motion.div
							key={i}
							initial={{ opacity: 0, x: -4 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{
								delay: 0.1 + i * 0.09,
								duration: 0.22,
								ease: "easeOut",
							}}
							className={cn("leading-[1.7]", {
								"flex items-start gap-1.5 mt-1": line.type === "prompt",
								"pl-3": line.type === "success" || line.type === "info",
							})}
						>
							{line.type === "prompt" && (
								<>
									<span className="text-white/50 text-[11px] shrink-0 leading-[1.7]">
										zenith@xlayer ~ $
									</span>
									<span className="text-white/90 text-[11px] break-all">
										{line.text}
									</span>
								</>
							)}
							{line.type === "success" && (
								<span className="text-[11px]">
									<span style={{ color: "var(--brand-accent)" }}>✓</span>
									<span className="text-white/50">{line.text?.slice(1)}</span>
								</span>
							)}
							{line.type === "info" && (
								<span className="text-white/25 text-[11px]">{line.text}</span>
							)}
						</motion.div>
					)
				})}
			</div>
		</motion.div>
	)
}

export function HeroSection() {
	return (
		<section className="relative overflow-hidden mx-auto flex w-full lg:h-(--hero-height) max-w-7xl min-w-0 flex-col border-x md:min-h-0 lg:flex-row">
			<ZenithDither opacity={0.26} />
			{/* Left: headline + CTAs + TechGrid */}
			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex flex-1 flex-col items-start justify-center px-5 pt-16 pb-8 sm:px-8 sm:pt-20 sm:pb-10 lg:px-10 xl:px-12">
					<div className="flex items-center gap-2 mb-5">
						<HeroBadge />
					</div>

					<motion.h1
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
						className="font-sans font-bold text-[36px] sm:text-[48px] leading-[1.05] tracking-tight"
					>
						Your Agent Spends.
						<br />
						<span className="text-[36px] sm:text-[48px] leading-[1.05] tracking-tight text-muted-foreground/80">
							You Own the Rules.
						</span>
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
						className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-[18px]"
					>
						The spend infrastructure for AI agents. Give any agent a wallet, a budget,
						and an audit trail — safe, controlled, and enforced onchain.
					</motion.p>

					<motion.div
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: "easeOut", delay: 0.35 }}
						className="mt-7 flex flex-wrap items-center gap-3 sm:gap-4"
					>
						<GetStartedButton />
						<SeeHowItWorksButton />
					</motion.div>

					{/* Mobile terminal — below CTAs, hidden on desktop */}
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
						className="lg:hidden w-full mt-10"
					>
						<HeroTerminal />
					</motion.div>
				</div>

				<div className="relative h-[160px] shrink-0 border-t border-border">
					<TechGrid />
				</div>
			</div>

			{/* Right: terminal widget — desktop only */}
			<div className="hidden border-border lg:flex lg:w-[440px] lg:flex-none lg:flex-col lg:items-center lg:justify-center lg:border-l lg:px-6 lg:py-8 xl:w-auto xl:flex-1 xl:px-8">
				<HeroTerminal />
			</div>
		</section>
	)
}
