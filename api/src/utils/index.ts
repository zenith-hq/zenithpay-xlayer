import { keccak256, toHex } from "viem";

export function intentToHash(intent: string): `0x${string}` {
  return keccak256(toHex(intent));
}

export function extractHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function usdcToUnits(amount: string): bigint {
  const [whole = "0", frac = ""] = amount.split(".");
  const padded = frac.padEnd(6, "0").slice(0, 6);
  return BigInt(whole) * 1_000_000n + BigInt(padded);
}

export function unitsToUsdc(units: bigint): string {
  const whole = units / 1_000_000n;
  const frac = units % 1_000_000n;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(6, "0").replace(/0+$/, "")}`;
}

export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${rand}${Date.now().toString(36)}`;
}
