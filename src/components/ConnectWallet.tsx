/* changelog/src/components/ConnectWallet.tsx
 *
 * Consolidated ConnectWallet component that centralizes wallet status checks
 * and connector logic previously in __root.tsx.
 *
 * Behavior:
 * - When connected (isConnected && address): shows truncated address + Disconnect button.
 * - When not connected: attempts to connect using an injected connector (MetaMask),
 *   falling back to the first available connector. Button is disabled if no connectors.
 *
 * Accessibility:
 * - Buttons have descriptive labels.
 * - Address is presented as text with an accessible description.
 */

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { useConnection, useConnect, useConnectors, useDisconnect } from "wagmi";
import { base } from "wagmi/chains";

export default function ConnectWallet() {
  const { address, isConnected } = useConnection();
  const { connect } = useConnect();
  const connectors = useConnectors();
  const { disconnect } = useDisconnect();

  // Choose the best connector to present to the user:
  // prefer an injected connector (MetaMask / browser wallets), otherwise pick the first available.
  const injectedConnector = useMemo(
    () => connectors?.find((c) => (c as any)?.type === "injected"),
    [connectors],
  );

  const primaryConnector = injectedConnector ?? connectors?.[0] ?? null;

  const handleConnect = async () => {
    if (!primaryConnector) return;
    try {
      // prefer the injected connector if available and connect to Base by default
      await connect?.({ connector: primaryConnector as any, chainId: base.id });
    } catch (err) {
      // keep UI resilient — log to console for debugging
      // eslint-disable-next-line no-console
      console.error("ConnectWallet: failed to connect", err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect?.();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("ConnectWallet: failed to disconnect", err);
    }
  };

  const truncatedAddress = (addr?: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  // Render connected state
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="text-sm text-muted-foreground"
          aria-live="polite"
          aria-atomic="true"
          title={address}
        >
          {truncatedAddress(address)}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          aria-label="Disconnect wallet"
        >
          <LogOut className="mr-2" />
          Disconnect
        </Button>
      </div>
    );
  }

  // Render disconnected state
  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleConnect}
      disabled={!primaryConnector}
      aria-label={
        primaryConnector
          ? `Connect wallet (${primaryConnector.name || "wallet"})`
          : "No wallet connectors available"
      }
      title={
        primaryConnector
          ? `Connect using ${primaryConnector.name || "wallet"}`
          : "No wallet connector detected"
      }
    >
      <Wallet className="mr-2" />
      {primaryConnector ? "Connect Wallet" : "Connect Wallet"}
    </Button>
  );
}
