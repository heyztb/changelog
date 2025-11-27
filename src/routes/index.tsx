import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { Paperclip, ArrowUp, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { LinkWarningModal } from "@/components/LinkWarningModal";

export const Route = createFileRoute("/")({
  component: IndexComponent,
});

interface Update {
  id: string;
  ethAddress: string;
  text: string;
  attachments: Array<{ type: "link"; url: string; title?: string }>;
  timestamp: string;
}

const MOCK_UPDATES: Update[] = [
  {
    id: "1",
    ethAddress: "0x71C...9A23",
    text: "Just shipped the new landing page! 🚀\n\nCheck it out live.",
    attachments: [
      { type: "link", url: "https://example.com", title: "Live Demo" },
    ],
    timestamp: "2h ago",
  },
  {
    id: "2",
    ethAddress: "0x3B2...4F12",
    text: "Working on the smart contract integration. These docs are a lifesaver.",
    attachments: [
      {
        type: "link",
        url: "https://docs.ethers.org",
        title: "Ethers.js Documentation",
      },
    ],
    timestamp: "4h ago",
  },
  {
    id: "3",
    ethAddress: "0x9D1...8E45",
    text: "Finally fixed that annoying bug in the authentication flow. Turns out it was a race condition.",
    attachments: [],
    timestamp: "6h ago",
  },
];

function IndexComponent() {
  const [message, setMessage] = useState("");
  const [showLinkWarning, setShowLinkWarning] = useState(false);
  const [pendingLink, setPendingLink] = useState<string | null>(null);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    url: string,
  ) => {
    e.preventDefault();
    if (localStorage.getItem("skip-link-warning") === "true") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    setPendingLink(url);
    setShowLinkWarning(true);
  };

  const handleConfirmLink = () => {
    if (pendingLink) {
      window.open(pendingLink, "_blank", "noopener,noreferrer");
      setShowLinkWarning(false);
      setPendingLink(null);
    }
  };

  const handleSubmit = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    (async () => {
      const isMiniapp = await sdk.isInMiniApp();
      if (isMiniapp) {
        await sdk.actions.ready();
      }
    })();
  });

  return (
    <div className="flex flex-col items-center mt-12 min-h-[80vh]">
      <div className="w-full max-w-3xl px-4">
        <h1 className="text-4xl font-semibold text-center mb-12 text-gray-900 dark:text-white">
          Build in public
        </h1>

        <div className="w-full rounded-3xl p-3 bg-white dark:bg-neutral-800 shadow-lg border border-gray-200 dark:border-neutral-700">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share your progress"
            className="w-full bg-transparent border-none text-black dark:text-white placeholder:text-gray-400 resize-none text-base focus-visible:ring-0 focus-visible:ring-offset-0 min-h-6 max-h-[200px]"
            rows={1}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full h-9 px-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700"
              >
                <Paperclip className="w-4 h-4 mr-1" />
                Attach
              </Button>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!message.trim()}
              className="bg-black text-white dark:bg-white dark:text-black rounded-full h-9 w-9 p-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="mt-12 relative before:absolute before:left-5 before:top-0 before:h-full before:w-px before:bg-gray-200 dark:before:bg-neutral-800 pb-12">
          {MOCK_UPDATES.map((update) => (
            <div key={update.id} className="relative pl-16 pb-12 last:pb-0">
              <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-500 shrink-0 ring-4 ring-white dark:ring-neutral-950 z-10" />

              <div className="pt-1">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-semibold text-gray-900 dark:text-white tracking-tight">
                    {update.ethAddress}
                  </span>
                  <span className="text-xs font-medium text-gray-400 dark:text-neutral-500">
                    {update.timestamp}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-[15px] mb-4">
                  {update.text}
                </p>

                {update.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {update.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => handleLinkClick(e, att.url)}
                        className="group flex items-center gap-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 hover:border-gray-300 dark:hover:border-neutral-700 transition-all w-full sm:w-auto shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {att.title || "External Link"}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-neutral-500 truncate max-w-[200px]">
                            {att.url
                              .replace(/^https?:\/\//, "")
                              .replace(/\/$/, "")}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <LinkWarningModal
        isOpen={showLinkWarning}
        onClose={() => setShowLinkWarning(false)}
        onConfirm={handleConfirmLink}
      />
    </div>
  );
}
