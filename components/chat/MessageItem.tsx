"use client";
import { useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthContext";

interface MessageItemProps {
  message: {
    id: string;
    content: string;
    imageUrl?: string | null;
    createdAt: string;
    editedAt?: string | null;
    username?: string | null;
    avatarColor?: string | null;
    userId: string;
  };
  isFirst: boolean;
  channelId: string;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
}

// 画像ライトボックス
function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>
      <img
        src={src}
        alt="画像"
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function renderContent(content: string) {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
      const lang = match?.[1] || "";
      const code = match?.[2] || part.slice(3, -3);
      return (
        <div key={i} className="my-2 rounded-lg overflow-hidden border border-white/10">
          {lang && (
            <div className="px-3 py-1 bg-white/5 text-xs text-white/40 font-mono border-b border-white/10">
              {lang}
            </div>
          )}
          <pre className="p-3 overflow-x-auto bg-[#0d0d1a]">
            <code className="text-sm font-mono text-emerald-300 whitespace-pre">{code}</code>
          </pre>
        </div>
      );
    } else if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 font-mono text-sm">
          {part.slice(1, -1)}
        </code>
      );
    } else {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const textParts = part.split(urlRegex);
      return (
        <span key={i}>
          {textParts.map((tp, j) =>
            /^https?:\/\//.test(tp) ? (
              <a key={j} href={tp} target="_blank" rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 break-all">
                {tp}
              </a>
            ) : (
              <span key={j} className="whitespace-pre-wrap break-words">{tp}</span>
            )
          )}
        </span>
      );
    }
  });
}

export function MessageItem({ message, isFirst, channelId, onDelete, onEdit }: MessageItemProps) {
  const { user } = useAuth();
  const date = new Date(message.createdAt);
  const isOwn = user?.id === message.userId;
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [lightbox, setLightbox] = useState(false);

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    await fetch(`/api/channels/${channelId}/messages/${message.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    onEdit(message.id, editContent);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("このメッセージを削除しますか？")) return;
    await fetch(`/api/channels/${channelId}/messages/${message.id}`, { method: "DELETE" });
    onDelete(message.id);
  };

  const actions = isOwn ? (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
      <button onClick={() => { setEditing(true); setEditContent(message.content); }}
        className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors" title="編集">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={handleDelete}
        className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors" title="削除">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  ) : null;

  const editArea = (
    <div className="mt-1">
      <textarea
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full bg-white/5 border border-indigo-500/50 rounded-lg px-3 py-2 text-white text-sm outline-none resize-none"
        rows={Math.max(2, editContent.split("\n").length)}
        autoFocus
      />
      <div className="flex gap-1.5 mt-1">
        <button onClick={handleSaveEdit}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors">
          <Check className="w-3 h-3" /> 保存
        </button>
        <button onClick={() => setEditing(false)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-white/40 hover:text-white/70 rounded hover:bg-white/5 transition-colors">
          <X className="w-3 h-3" /> キャンセル
        </button>
      </div>
    </div>
  );

  const imageBlock = message.imageUrl && !editing && (
    <div className="mt-2">
      <img
        src={message.imageUrl}
        alt="添付画像"
        className="max-w-lg max-h-80 rounded-lg object-contain border border-white/10 cursor-zoom-in hover:opacity-90 transition-opacity"
        onClick={() => setLightbox(true)}
      />
    </div>
  );

  if (!isFirst) {
    return (
      <>
        <div className="group flex items-start gap-3 px-4 py-0.5 hover:bg-white/[0.02] rounded-lg transition-colors">
          <div className="w-9 flex-shrink-0 flex justify-end">
            <span className="text-[10px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
              {format(date, "HH:mm")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {editing ? editArea : (
              <div className="flex items-start gap-2">
                <div className="flex-1 text-white/80 text-sm leading-relaxed">
                  {renderContent(message.content)}
                  {message.editedAt && <span className="text-[10px] text-white/25 ml-1">(編集済み)</span>}
                </div>
                {actions}
              </div>
            )}
            {imageBlock}
          </div>
        </div>
        {lightbox && message.imageUrl && <ImageLightbox src={message.imageUrl} onClose={() => setLightbox(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="group flex items-start gap-3 px-4 py-2 hover:bg-white/[0.02] rounded-lg transition-colors mt-1">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 select-none"
          style={{ backgroundColor: message.avatarColor || "#6366f1" }}
        >
          {getInitials(message.username || "?")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-white font-semibold text-sm">{message.username}</span>
            <span className="text-white/30 text-xs">{format(date, "M月d日 HH:mm", { locale: ja })}</span>
            {message.editedAt && <span className="text-[10px] text-white/25">(編集済み)</span>}
          </div>
          {editing ? editArea : (
            <div className="flex items-start gap-2">
              <div className="flex-1 text-white/80 text-sm leading-relaxed">
                {renderContent(message.content)}
              </div>
              {actions}
            </div>
          )}
          {imageBlock}
        </div>
      </div>
      {lightbox && message.imageUrl && <ImageLightbox src={message.imageUrl} onClose={() => setLightbox(false)} />}
    </>
  );
}
