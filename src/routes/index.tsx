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

        <div className="mt-12 space-y-8 pb-12">
          {MOCK_UPDATES.map((update) => (
            <div key={update.id} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-500 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {update.ethAddress}
                  </span>
                  <span className="text-sm text-gray-500">
                    {update.timestamp}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {update.text}
                </p>
                {update.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {update.attachments.map((att, i) => (
                      <a
                        key={i}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => handleLinkClick(e, att.url)}
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors border border-blue-100 dark:border-blue-800"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {att.title || att.url}
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
