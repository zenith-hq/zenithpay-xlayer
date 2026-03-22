"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useConnection } from "wagmi";
import { getAgentByAddress, getAgentsByOwner } from "@/lib/api";

const FALLBACK_AGENT =
  process.env.NEXT_PUBLIC_AGENT_ADDRESS ??
  "0x726Cf0C4Fe559DB9A32396161694C7b88C60C947";

function deriveDisplayName(label: string | null, address: string): string {
  if (label) return label;
  return `Agent ${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface AgentContextValue {
  agentAddress: string;
  agentLabel: string | null;
  agentDisplayName: string;
  loading: boolean;
}

const AgentContext = createContext<AgentContextValue>({
  agentAddress: FALLBACK_AGENT,
  agentLabel: null,
  agentDisplayName: deriveDisplayName(null, FALLBACK_AGENT),
  loading: false,
});

export function AgentProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useConnection();
  const [agentAddress, setAgentAddress] = useState(FALLBACK_AGENT);
  const [agentLabel, setAgentLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setAgentAddress(FALLBACK_AGENT);
      setAgentLabel(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getAgentsByOwner(address)
      .then(async (res) => {
        if (cancelled) return;
        const first = res.agents[0];
        if (first) {
          setAgentAddress(first.address);
          setAgentLabel(first.label);
          return;
        }
        // owner_eoa mismatch — look up by known agent address directly
        try {
          const byAddr = await getAgentByAddress(FALLBACK_AGENT);
          if (!cancelled && byAddr.agents[0]) {
            setAgentLabel(byAddr.agents[0].label);
          }
        } catch {
          // no-op — label stays null, address stays FALLBACK_AGENT
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAgentAddress(FALLBACK_AGENT);
          setAgentLabel(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  const agentDisplayName = deriveDisplayName(agentLabel, agentAddress);

  return (
    <AgentContext.Provider
      value={{ agentAddress, agentLabel, agentDisplayName, loading }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent(): AgentContextValue {
  return useContext(AgentContext);
}
