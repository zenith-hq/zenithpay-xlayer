import { parseUnits } from "viem";

export const SPEND_POLICY_ADDRESS = (process.env
  .NEXT_PUBLIC_SPEND_POLICY_ADDRESS ??
  "0xF5875F25ccEB2edDc57F218eaF1F71c5CF161f21") as `0x${string}`;

export const XLAYER_EXPLORER = "https://www.oklink.com/xlayer";

export function usdcToUnits(amount: string): bigint {
  return parseUnits(amount, 6);
}

/** AgentStatus enum from SpendPolicy.sol */
export const AgentStatus = {
  NotRegistered: 0,
  Active: 1,
  Deactivated: 2,
  Revoked: 3,
} as const;

export const SPEND_POLICY_ABI = [
  {
    type: "function",
    name: "agentStatus",
    inputs: [{ name: "agent", type: "address", internalType: "address" }],
    outputs: [
      { name: "", type: "uint8", internalType: "enum SpendPolicy.AgentStatus" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPolicy",
    inputs: [{ name: "agent", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct SpendPolicy.Policy",
        components: [
          { name: "perTxLimit", type: "uint256", internalType: "uint256" },
          { name: "dailyLimit", type: "uint256", internalType: "uint256" },
          { name: "dailySpent", type: "uint256", internalType: "uint256" },
          { name: "windowStart", type: "uint256", internalType: "uint256" },
          {
            name: "status",
            type: "uint8",
            internalType: "enum SpendPolicy.AgentStatus",
          },
          {
            name: "merchantAllowlistEnabled",
            type: "bool",
            internalType: "bool",
          },
          { name: "humanOwner", type: "address", internalType: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerAgent",
    inputs: [
      { name: "agent", type: "address", internalType: "address" },
      { name: "perTxLimit", type: "uint256", internalType: "uint256" },
      { name: "dailyLimit", type: "uint256", internalType: "uint256" },
      { name: "merchantAllowlistEnabled", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updatePolicy",
    inputs: [
      { name: "agent", type: "address", internalType: "address" },
      { name: "perTxLimit", type: "uint256", internalType: "uint256" },
      { name: "dailyLimit", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deactivateAgent",
    inputs: [{ name: "agent", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "reactivateAgent",
    inputs: [{ name: "agent", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeAgent",
    inputs: [{ name: "agent", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      {
        name: "agent",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "humanOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "perTxLimit",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "dailyLimit",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PolicyUpdated",
    inputs: [
      {
        name: "agent",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "perTxLimit",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "dailyLimit",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  { type: "error", name: "AgentAlreadyRegistered", inputs: [] },
  { type: "error", name: "AgentAlreadyRevoked", inputs: [] },
  { type: "error", name: "AgentNotActive", inputs: [] },
  { type: "error", name: "AgentNotRegistered", inputs: [] },
  { type: "error", name: "InvalidLimits", inputs: [] },
  { type: "error", name: "NotHumanOwner", inputs: [] },
  { type: "error", name: "ZeroAddress", inputs: [] },
  { type: "error", name: "ZeroAmount", inputs: [] },
] as const;
