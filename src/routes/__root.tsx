import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, createConfig, WagmiProvider } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";

export const Route = createRootRoute({
  component: RootComponent,
});

const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: [miniAppConnector()],
});
const queryClient = new QueryClient();

function RootComponent() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1 container mx-auto px-4 py-8">
            <Outlet />
          </main>
        </div>
        {process.env.NODE_ENV !== "production" && <TanStackRouterDevtools />}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
