import React, { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ProjectSelector from "@/components/ProjectSelector";
import { Paperclip, ArrowUp, ExternalLink, X } from "lucide-react";

type Attachment = {
  id: string;
  url: string;
  title?: string;
  loading?: boolean;
};

interface ComposerProps {
  projects: string[];
  addProject: (name: string) => boolean;
  isLoaded: boolean;
  onLinkClick?: (e: React.MouseEvent<HTMLAnchorElement>, url: string) => void;
}

export function Composer({
  projects,
  addProject,
  isLoaded,
  onLinkClick,
}: ComposerProps) {
  const [message, setMessage] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mountedRef = useRef(true);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const cryptoRandomId = () =>
    Math.random().toString(36).slice(2) + Date.now().toString(36);

  // URL utilities
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const isValidUrl = (s: string) => {
    try {
      const u = new URL(s);
      return (
        (u.protocol === "http:" || u.protocol === "https:") &&
        /\./.test(u.hostname)
      );
    } catch {
      return false;
    }
  };
  const extractUrls = (text: string) => {
    const matches = Array.from(
      new Set((text.match(urlRegex) || []).map((u) => u.replace(/[.,;]$/, ""))),
    );
    return matches.filter(isValidUrl);
  };

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Fetch title (client-side). Falls back to hostname if fetch fails or CORS blocks.
  const fetchTitle = async (url: string) => {
    try {
      const res = await fetch(url, { method: "GET" });
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, "text/html");
      const og = doc
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content");
      const twitter = doc
        .querySelector('meta[name="twitter:title"]')
        ?.getAttribute("content");
      const titleTag = doc.querySelector("title")?.textContent;
      return (og || twitter || titleTag || undefined)?.trim() ?? undefined;
    } catch {
      try {
        return new URL(url).hostname.replace(/^www\./, "");
      } catch {
        return url;
      }
    }
  };

  // Merge new attachments and fetch metadata for each new URL
  const addAttachments = async (urls: string[]) => {
    if (urls.length === 0) return;

    setAttachments((prev) => {
      const existing = new Set(prev.map((a) => a.url));
      const merged = [...prev];
      urls.forEach((u) => {
        if (!existing.has(u))
          merged.push({ id: cryptoRandomId(), url: u, loading: true });
      });
      return merged;
    });

    for (const u of urls) {
      const title = await fetchTitle(u);
      if (!mountedRef.current) return;
      setAttachments((prev) =>
        prev.map((a) => (a.url === u ? { ...a, title, loading: false } : a)),
      );
    }
  };

  // Submit the ship (placeholder POST). Clears composer on success.
  const handleSubmit = async () => {
    if (!message.trim() || !selectedProject) return;

    const payload = {
      text: message.trim(),
      project: selectedProject,
      attachments: attachments.map((a) => ({ url: a.url, title: a.title })),
      timestamp: Date.now(),
    };

    try {
      // Placeholder: wire this to your real backend / EAS flow
      await fetch("/api/ships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // swallow; console for debug
      // eslint-disable-next-line no-console
      console.error("Failed to submit ship", err);
    }

    setMessage("");
    setSelectedProject(null);
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
      return;
    }

    // If input is empty and Backspace pressed -> clear ALL attachments
    if (e.key === "Backspace") {
      if (message.trim() === "" && attachments.length > 0) {
        e.preventDefault();
        setAttachments([]);
      }
    }
  };

  // Paste: extract full URLs, remove them from inserted text and attach them
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const paste = e.clipboardData?.getData("text") || "";
    const urls = extractUrls(paste);
    if (urls.length === 0) return;

    e.preventDefault();

    // Remove URLs from pasted text
    let cleaned = paste;
    for (const u of urls) {
      cleaned = cleaned.replace(new RegExp(escapeRegExp(u), "g"), " ");
    }
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    const ta = textareaRef.current ?? (e.currentTarget as HTMLTextAreaElement);
    const start = ta.selectionStart ?? message.length;
    const end = ta.selectionEnd ?? message.length;
    const newVal =
      message.slice(0, start) +
      (cleaned ? `${cleaned}` : "") +
      message.slice(end);
    setMessage(newVal.trim());

    void addAttachments(urls);
    // set caret position: try to place after inserted cleaned text
    setTimeout(() => {
      try {
        const pos = start + (cleaned ? cleaned.length : 0);
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = pos;
        }
      } catch {
        // ignore
      }
    }, 0);
  };

  // On typing: debounce extraction so partial inputs don't attach.
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    // @ts-ignore - DOM timeout id is numeric in browsers
    debounceRef.current = window.setTimeout(() => {
      const urls = extractUrls(val);
      if (urls.length) {
        const existing = new Set(attachments.map((a) => a.url));
        const newUrls = urls.filter((u) => !existing.has(u));
        if (newUrls.length) {
          // remove only the newly-detected URLs from the textarea value
          let cleaned = val;
          for (const u of newUrls) {
            cleaned = cleaned.replace(new RegExp(escapeRegExp(u), "g"), " ");
          }
          cleaned = cleaned.replace(/\s+/g, " ").trim();
          setMessage(cleaned);
          void addAttachments(newUrls);
        }
      }
      // do NOT clear attachments if user removed URL text manually; attachments persist
    }, 500);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="w-full rounded-3xl p-3 bg-white dark:bg-neutral-800 shadow-lg border border-gray-200 dark:border-neutral-700">
      <Textarea
        ref={textareaRef as any}
        value={message}
        onChange={handleChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        placeholder="What did you make progress on today?"
        className="w-full bg-transparent border-none text-black dark:text-white placeholder:text-gray-400 resize-none text-base focus-visible:ring-0 focus-visible:ring-offset-0 min-h-6 max-h-[200px]"
        rows={2}
      />

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative group flex items-center gap-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 hover:border-gray-300 dark:hover:border-neutral-700 transition-all w-full sm:w-auto shadow-sm hover:shadow-md"
            >
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => onLinkClick?.(e as any, att.url)}
                className="flex items-center gap-3"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {att.loading ? "Loading..." : att.title || "External Link"}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-neutral-500 truncate max-w-[200px]">
                    {att.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </span>
                </div>
              </a>

              <button
                type="button"
                aria-label="Remove attachment"
                onClick={() => removeAttachment(att.id)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-neutral-800 p-1 rounded-full transition-opacity"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

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

          <ProjectSelector
            selectedProject={selectedProject}
            onSelectProject={(p) => setSelectedProject(p)}
            projects={projects}
            addProject={addProject}
            isLoaded={isLoaded}
          />
        </div>

        <Button
          onClick={() => void handleSubmit()}
          disabled={!message.trim() || !selectedProject}
          className="bg-black text-white dark:bg-white dark:text-black rounded-full h-9 w-9 p-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
