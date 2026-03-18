"use client"

import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const TABS = ["MCP", "Skill", "API"] as const
type Tab = (typeof TABS)[number]

function Cm({ children }: { children: React.ReactNode }) {
	return <span className="text-white/25">{children}</span>
}
function Kw({ children }: { children: React.ReactNode }) {
	return <span className="text-white/50">{children}</span>
}
function Str({ children }: { children: React.ReactNode }) {
	return <span className="text-white/65">{children}</span>
}
function Val({ children }: { children: React.ReactNode }) {
	return <span className="text-white/85">{children}</span>
}
function Dim({ children }: { children: React.ReactNode }) {
	return <span className="text-white/40">{children}</span>
}

const CODE: Record<Tab, React.ReactNode> = {
	MCP: (
		<div className="font-mono text-[11px] leading-[1.85]">
			<div>
				<Cm>{"// .claude/settings.json — add ZenithPay MCP server"}</Cm>
			</div>
			<div className="mt-1">
				<Val>{"{"}</Val>
			</div>
			<div className="pl-4">
				<Str>"mcpServers"</Str>
				<Dim>: {"{"}</Dim>
			</div>
			<div className="pl-8">
				<Str>"zenithpay"</Str>
				<Dim>: {"{"}</Dim>
			</div>
			<div className="pl-12">
				<Str>"url"</Str>
				<Dim>: </Dim>
				<Str>"https://api.usezenithpay.xyz/mcp"</Str>
				<Dim>,</Dim>
			</div>
			<div className="pl-12">
				<Str>"env"</Str>
				<Dim>: {"{"}</Dim>
			</div>
			<div className="pl-16">
				<Str>"AGENT_ADDRESS"</Str>
				<Dim>: </Dim>
				<Str>"0xcadf92...1a9"</Str>
			</div>
			<div className="pl-12">
				<Dim>{"}"}</Dim>
			</div>
			<div className="pl-8">
				<Dim>{"}"}</Dim>
			</div>
			<div className="pl-4">
				<Dim>{"}"}</Dim>
			</div>
			<div>
				<Val>{"}"}</Val>
			</div>
			<div className="mt-4 border-t border-white/8 pt-3">
				<Cm>{"// 3 tools exposed to your agent:"}</Cm>
				<div className="mt-1">
					<Dim>zenithpay_balance</Dim>
					<Cm>{"  · wallet + remaining budget"}</Cm>
				</div>
				<div>
					<Dim>zenithpay_pay_service</Dim>
					<Cm>{"  · policy-gated payment"}</Cm>
				</div>
				<div>
					<Dim>zenithpay_set_limits</Dim>
					<Cm>{"  · set per-tx cap + daily budget"}</Cm>
				</div>
			</div>
		</div>
	),

	API: (
		<div className="font-mono text-[11px] leading-[1.85]">
			<div>
				<Cm>{"// POST /pay — policy check runs before any funds move"}</Cm>
			</div>
			<div className="mt-1">
				<Kw>const </Kw>
				<Val>res </Val>
				<Kw>= </Kw>
				<Kw>await </Kw>
				<Val>fetch</Val>
				<Dim>(</Dim>
			</div>
			<div className="pl-4">
				<Str>"https://api.usezenithpay.xyz/pay"</Str>
				<Dim>,</Dim>
			</div>
			<div className="pl-4">
				<Dim>{"{"}</Dim>
			</div>
			<div className="pl-8">
				<Dim>method: </Dim>
				<Str>"POST"</Str>
				<Dim>,</Dim>
			</div>
			<div className="pl-8">
				<Dim>{"headers: { "}</Dim>
				<Str>"Content-Type"</Str>
				<Dim>{": "}</Dim>
				<Str>"application/json"</Str>
				<Dim>{" },"}</Dim>
			</div>
			<div className="pl-8">
				<Dim>body: </Dim>
				<Val>JSON.stringify</Val>
				<Dim>{"({"}</Dim>
			</div>
			<div className="pl-12">
				<Dim>serviceUrl: </Dim>
				<Str>"https://stableenrich.dev/search"</Str>
				<Dim>,</Dim>
			</div>
			<div className="pl-12">
				<Dim>maxAmount: </Dim>
				<Str>"0.05"</Str>
				<Dim>,</Dim>
			</div>
			<div className="pl-12">
				<Dim>intent: </Dim>
				<Str>"Fetch DeFi market data"</Str>
				<Dim>,</Dim>
			</div>
			<div className="pl-12">
				<Dim>agentAddress: </Dim>
				<Str>"0xcadf92...1a9"</Str>
				<Dim>,</Dim>
			</div>
			<div className="pl-8">
				<Dim>{"}),"}</Dim>
			</div>
			<div className="pl-4">
				<Dim>{"}"}</Dim>
			</div>
			<div>
				<Dim>{")"}</Dim>
				<Val>;</Val>
			</div>
			<div className="mt-4 border-t border-white/8 pt-3">
				<div>
					<Cm>{"// 200"}</Cm>
					<Dim>{"  · "}</Dim>
					<Val>approved — policy check passed</Val>
				</div>
				<div>
					<Cm>{"// 403"}</Cm>
					<Dim>{"  · "}</Dim>
					<Val>blocked — daily budget exceeded</Val>
				</div>
				<div>
					<Cm>{"// 402"}</Cm>
					<Dim>{"  · "}</Dim>
					<Val>payment required upstream</Val>
				</div>
			</div>
		</div>
	),

	Skill: (
		<div className="font-mono text-[11px] leading-[1.85]">
			<div>
				<Cm>{"// Paste into your agent to install ZenithPay"}</Cm>
			</div>
			<div className="mt-1">
				<Val>Set up </Val>
				<Str>https://api.usezenithpay.xyz/skill.md</Str>
			</div>
			<div className="mt-4 border-t border-white/8 pt-3">
				<Cm>{"// Your agent reads the skill file and gets 3 tools:"}</Cm>
				<div className="mt-1">
					<Dim>zenithpay_balance</Dim>
					<Cm>{"  · wallet + remaining budget"}</Cm>
				</div>
				<div>
					<Dim>zenithpay_pay_service</Dim>
					<Cm>{"  · policy-gated payment"}</Cm>
				</div>
				<div>
					<Dim>zenithpay_set_limits</Dim>
					<Cm>{"  · set per-tx cap + daily budget"}</Cm>
				</div>
			</div>
			<div className="mt-4 border-t border-white/8 pt-3">
				<Cm>{"// Works with any agent that supports skills:"}</Cm>
				<div className="mt-1">
					<Val>Claude Code</Val>
					<Dim> · </Dim>
					<Val>OpenClaw</Val>
					<Dim> · </Dim>
					<Val>Codex</Val>
					<Dim> · </Dim>
					<Val>Gemini CLI</Val>
					<Dim> · </Dim>
					<Val>Claude Desktop</Val>
					<Dim> · </Dim>
					<Val>Cursor</Val>
				</div>
			</div>
		</div>
	),
}

const TAB_DESCRIPTIONS: Record<Tab, string> = {
	MCP: "Register ZenithPay as an MCP server. Your agent gets three tools — balance check, policy-gated payment, and spend limit control.",
	API: "Call ZenithPay directly over HTTP. Every payment request is policy-checked and logged on X Layer before funds move.",
	Skill: "One line to install. Your agent reads the skill file and gets all three ZenithPay tools instantly — balance, payments, and spend limits.",
}

export function IntegrationsSection() {
	const [activeTab, setActiveTab] = useState<Tab>("MCP")

	return (
		<section id="integrations" className="mx-auto w-full max-w-7xl border-x border-t">
			<div className="px-5 py-16 sm:px-8 lg:px-12">
				<div className="flex flex-col lg:flex-row lg:gap-12 xl:gap-16">
					{/* Left: heading + tabs */}
					<div className="mb-10 lg:mb-0 lg:w-[320px] xl:w-[360px] lg:shrink-0">
						<span className="text-xs uppercase tracking-[0.2em] text-brand-accent font-mono">
							[03] Integrations
						</span>
						<h2 className="mt-3 text-[28px] sm:text-[36px] font-bold tracking-tight leading-[1.05]">
							Add spend policy in minutes.
						</h2>

						<AnimatePresence mode="wait">
							<motion.p
								key={activeTab}
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								transition={{ duration: 0.2 }}
								className="mt-3 text-sm text-muted-foreground leading-relaxed"
							>
								{TAB_DESCRIPTIONS[activeTab]}
							</motion.p>
						</AnimatePresence>

						{/* Tab buttons */}
						<div className="mt-8 flex flex-col gap-px bg-border border border-border">
							{TABS.map((tab) => (
								<button
									key={tab}
									type="button"
									onClick={() => setActiveTab(tab)}
									className={cn(
										"flex items-center justify-between px-4 py-3.5 text-left bg-background transition-colors duration-150 cursor-pointer group",
										activeTab === tab
											? "text-brand-accent"
											: "text-muted-foreground hover:text-foreground"
									)}
								>
									<span className="font-mono text-xs uppercase tracking-[0.15em]">
										{tab}
									</span>
									<span
										className={cn(
											"size-1.5 rounded-full transition-all duration-200",
											activeTab === tab
												? "bg-brand-accent"
												: "bg-border group-hover:bg-muted-foreground"
										)}
									/>
								</button>
							))}
						</div>

						{/* Works with */}
						<div className="mt-6">
							<span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 font-mono">
								Works with
							</span>
							<div className="mt-2.5 flex flex-wrap gap-1.5">
								{[
									{ name: "Claude Code", logo: "/agents/claudecode-color.png" },
									{ name: "OpenClaw", logo: "/agents/openclaw-color.png" },
									{ name: "Codex", logo: "/agents/codex-color.png" },
									{ name: "Claude Desktop", logo: "/agents/claude-color.png" },
									{ name: "Cursor", logo: "/agents/cursor.png" },
									{ name: "Gemini CLI", logo: "/agents/gemini-color.svg" },
								].map(({ name, logo }) => (
									<span
										key={name}
										className="flex items-center gap-1.5 font-mono text-[10px] px-2 py-1 border border-border text-muted-foreground/70 bg-background"
									>
										{logo && (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={logo}
												alt={name}
												width={12}
												height={12}
												className="size-3 object-contain opacity-70"
												onError={(e) => {
													e.currentTarget.style.display = "none"
												}}
											/>
										)}
										{name}
									</span>
								))}
							</div>
						</div>
					</div>

					{/* Right: code panel */}
					<div className="relative flex-1 min-w-0">
						{/* Code window chrome */}
						<div className="border border-border overflow-hidden">
							<div className="relative flex items-center px-3 h-8 border-b border-border bg-background">
								<div className="flex items-center gap-1.5">
									<span className="size-2 rounded-full bg-foreground/15" />
									<span className="size-2 rounded-full bg-foreground/15" />
									<span className="size-2 rounded-full bg-foreground/15" />
								</div>
								<span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-muted-foreground/40 pointer-events-none tracking-wide">
									{activeTab === "Skill"
										? "skill.md"
										: `${activeTab.toLowerCase().replace(" ", "-")}.ts`}
								</span>
							</div>

							<div className="bg-[#0d0d0d] px-5 py-5 min-h-[320px]">
								<AnimatePresence mode="wait">
									<motion.div
										key={activeTab}
										initial={{ opacity: 0, y: 6 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -6 }}
										transition={{ duration: 0.2, ease: "easeOut" }}
									>
										{CODE[activeTab]}
									</motion.div>
								</AnimatePresence>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
