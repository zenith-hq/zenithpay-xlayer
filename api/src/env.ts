import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  XLAYER_RPC_URL: z.string().default("https://rpc.xlayer.tech"),
  OKX_API_KEY: z.string(),
  OKX_SECRET_KEY: z.string(),
  OKX_PASSPHRASE: z.string(),
  OKX_PROJECT_ID: z.string().optional(),
  SPEND_POLICY_ADDRESS: z
    .string()
    .default("0x0000000000000000000000000000000000000001"),
  DATABASE_URL: z.string(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  ZENITHPAY_API_KEY_SECRET: z.string(),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error(
      "Invalid environment variables:",
      result.error.flatten().fieldErrors,
    );
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
