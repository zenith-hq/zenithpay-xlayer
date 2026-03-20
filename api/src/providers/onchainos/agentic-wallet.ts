import { okxFetch } from "./client";

interface WalletLoginResponse {
  userId: string;
  sessionToken: string;
}

interface WalletCreateResponse {
  address: string;
  walletId: string;
}

export async function walletLogin(email: string): Promise<WalletLoginResponse> {
  const data = await okxFetch<WalletLoginResponse>(
    "/api/v6/waas/wallet/login",
    {
      method: "POST",
      body: { email },
    },
  );
  return data;
}

export async function walletVerify(
  email: string,
  otp: string,
  sessionToken: string,
): Promise<{ verified: boolean }> {
  const data = await okxFetch<{ verified: boolean }>(
    "/api/v6/waas/wallet/verify",
    {
      method: "POST",
      body: { email, otp, sessionToken },
    },
  );
  return data;
}

export async function walletCreate(
  sessionToken: string,
  label?: string,
): Promise<WalletCreateResponse> {
  const data = await okxFetch<WalletCreateResponse>(
    "/api/v6/waas/wallet/create",
    {
      method: "POST",
      body: { sessionToken, label, chainIndex: "196" },
    },
  );
  return data;
}
