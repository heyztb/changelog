import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, createConfig, WagmiProvider, injected } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ModeToggle } from "@/components/ModeToggle";
import { sdk } from "@farcaster/miniapp-sdk";
import Nav from "@/components/Nav";
import ConnectWallet from "@/components/ConnectWallet";

export const Route = createRootRoute({
  component: RootComponent,
});

const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: [miniAppConnector(), injected()],
});
const queryClient = new QueryClient();

function RootComponent() {
  const [isMiniapp, setIsMiniapp] = useState<boolean | null>(null);
  const [userFid, setUserFid] = useState(0);

  useEffect(() => {
    (async () => {
      const miniappStatus = await sdk.isInMiniApp();
      setIsMiniapp(miniappStatus);
      if (miniappStatus) {
        const context = await sdk.context;
        if (context && context.user && context.user.fid) {
          setUserFid(context.user.fid);
        }
        await sdk.actions.ready();
      }
    })();
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="changelog-theme">
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <div className="flex flex-col min-h-screen">
            {isMiniapp === false && (
              <header className="border-b">
                <div className="container mx-auto px-4 py-4 flex justify-end items-center gap-4">
                  <ModeToggle />
                  <ConnectWallet />
                </div>
              </header>
            )}
            <main className="flex-1 container mx-auto px-4 py-8">
              <Outlet />
              {isMiniapp && <Nav fid={userFid} />}
            </main>
          </div>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
