"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useConnection } from "wagmi";
import { getAgentsByOwner } from "@/lib/api";

function deriveDisplayName(label: string | null, address: string): string {
  if (!address) return "No agent";
  if (label) return label;
  return `Agent ${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface AgentContextValue {
  agentAddress: string;
  hasAgent: boolean;
  agentLabel: string | null;
  agentDisplayName: string;
  loading: boolean;
}

const AgentContext = createContext<AgentContextValue>({
  agentAddress: "",
  hasAgent: false,
  agentLabel: null,
  agentDisplayName: "No agent",
  loading: false,
});

export function AgentProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useConnection();
  const [agentAddress, setAgentAddress] = useState("");
  const [agentLabel, setAgentLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setAgentAddress("");
      setAgentLabel(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getAgentsByOwner(address)
      .then((res) => {
        if (cancelled) return;
        const first = res.agents[0];
        if (first) {
          setAgentAddress(first.address);
          setAgentLabel(first.label);
          return;
        }
        setAgentAddress("");
        setAgentLabel(null);
      })
      .catch(() => {
        if (!cancelled) {
          setAgentAddress("");
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
  const hasAgent = Boolean(agentAddress);

  return (
    <AgentContext.Provider
      value={{ agentAddress, hasAgent, agentLabel, agentDisplayName, loading }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent(): AgentContextValue {
  return useContext(AgentContext);
}
