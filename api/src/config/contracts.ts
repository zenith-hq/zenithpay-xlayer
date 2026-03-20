import { env } from "../env";

export const SPEND_POLICY_ADDRESS = env.SPEND_POLICY_ADDRESS as `0x${string}`;

export const SPEND_POLICY_ABI = [
  {
    type: "function",
    name: "getPolicy",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "perTxLimit", type: "uint256" },
          { name: "dailyLimit", type: "uint256" },
          { name: "dailySpent", type: "uint256" },
          { name: "windowStart", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "merchantAllowlistEnabled", type: "bool" },
          { name: "humanOwner", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "checkPayment",
    inputs: [
      { name: "agent", type: "address" },
      { name: "merchant", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [
      { name: "allowed", type: "bool" },
      { name: "reason", type: "string" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getRemainingDailyBudget",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isMerchantAllowed",
    inputs: [
      { name: "agent", type: "address" },
      { name: "merchant", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "agentStatus",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "humanOwnerOf",
    inputs: [{ name: "agent", type: "address" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerAgent",
    inputs: [
      { name: "agent", type: "address" },
      { name: "perTxLimit", type: "uint256" },
      { name: "dailyLimit", type: "uint256" },
      { name: "merchantAllowlistEnabled", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updatePolicy",
    inputs: [
      { name: "agent", type: "address" },
      { name: "perTxLimit", type: "uint256" },
      { name: "dailyLimit", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowMerchant",
    inputs: [
      { name: "agent", type: "address" },
      { name: "merchant", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "removeMerchant",
    inputs: [
      { name: "agent", type: "address" },
      { name: "merchant", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "toggleMerchantAllowlist",
    inputs: [
      { name: "agent", type: "address" },
      { name: "enabled", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "executePayment",
    inputs: [
      { name: "merchant", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "intentHash", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;
