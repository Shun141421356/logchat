"use client";
import { useState, useRef, useCallback } from "react";
import { Send, Image, X, Code } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (content: string, imageUrl?: string) => Promise<void>;
  channelName: string;
  isArchived: boolean;
}

export function MessageInput({ onSend, channelName, isArchived }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageData = useCallback(async (base64: string, mimeType: string) => {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageData: base64, mimeType }),
    });
    const { url } = await res.json();
    setImagePreview(url);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(",")[1];
      handleImageData(base64, file.type);
    };
    reader.readAsDataURL(file);
  }, [handleImageData]);

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        if (file) handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const insertCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const codeBlock = selected ? `\`\`\`\n${selected}\n\`\`\`` : "```\n\n```";
    const newContent = content.slice(0, start) + codeBlock + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      const pos = selected ? start + codeBlock.length : start + 4;
      textarea.setSelectionRange(pos, pos);
      textarea.focus();
    }, 0);
  };

  const handleSubmit = async () => {
    if ((!content.trim() && !imagePreview) || sending) return;
    setSending(true);
    try {
      await onSend(content, imagePreview || undefined);
      setContent("");
      setImagePreview(null);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isArchived) {
    return (
      <div className="px-4 py-4 border-t border-white/5">
        <div className="flex items-center justify-center gap-2 py-2 text-white/30 text-sm">
          <span>このチャンネルはアーカイブされています</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 border-t border-white/5">
      {/* 画像プレビュー */}
      {imagePreview && (
        <div className="mb-3 relative inline-block">
          <img
            src={imagePreview}
            alt="プレビュー"
            className="max-h-48 rounded-lg border border-white/10 object-contain"
          />
          <button
            onClick={() => setImagePreview(null)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* 入力エリア */}
      <div
        className={cn(
          "flex items-end gap-2 bg-white/5 rounded-xl border transition-all",
          dragOver ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 focus-within:border-white/20"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={`#${channelName} にメッセージを送る...`}
          rows={1}
          className="flex-1 bg-transparent text-white/90 placeholder-white/25 text-sm px-4 py-3 resize-none outline-none leading-relaxed"
          style={{ minHeight: "44px" }}
        />

        <div className="flex items-center gap-1 px-2 pb-2">
          <button
            onClick={insertCodeBlock}
            title="コードブロック"
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            title="画像を添付"
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
          >
            <Image className="w-4 h-4" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={(!content.trim() && !imagePreview) || sending}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              (content.trim() || imagePreview) && !sending
                ? "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20"
                : "text-white/15 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = "";
        }}
      />

      <div className="mt-1.5 text-xs text-white/20 px-1">
        Shift+Enter で改行 / Enter で送信 / 画像ペースト対応
      </div>
    </div>
  );
}
