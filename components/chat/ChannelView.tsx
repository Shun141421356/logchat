"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Hash, Archive, Menu } from "lucide-react";
import { MessageItem } from "./MessageItem";
import { MessageInput } from "./MessageInput";

interface Message {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  editedAt?: string | null;
  userId: string;
  username?: string | null;
  avatarColor?: string | null;
}

interface ChannelViewProps {
  channelId: string;
  channelName: string;
  isArchived: boolean;
  onOpenSidebar: () => void;
}

export function ChannelView({ channelId, channelName, isArchived, onOpenSidebar }: ChannelViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastCountRef = useRef(0);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/channels/${channelId}/messages?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        // 新メッセージがあれば最下部へスクロール
        if (data.length > lastCountRef.current) {
          lastCountRef.current = data.length;
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    lastCountRef.current = 0;
    fetchMessages();

    pollRef.current = setInterval(fetchMessages, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [channelId, fetchMessages]);

  // 初回ロード後にスクロール
  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [loading]);

  const handleSend = async (content: string, imageUrl?: string) => {
    const res = await fetch(`/api/channels/${channelId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, imageUrl }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => {
        const next = [...prev, msg];
        lastCountRef.current = next.length;
        return next;
      });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const handleDelete = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    lastCountRef.current -= 1;
  };

  const handleEdit = (messageId: string, newContent: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, content: newContent, editedAt: new Date().toISOString() } : m
      )
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen min-w-0">
      {/* チャンネルヘッダー */}
      <div className="px-3 md:px-4 py-3 border-b border-white/5 flex items-center gap-2 flex-shrink-0 bg-[#13131f]/80 backdrop-blur-sm">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 -ml-1 rounded-md hover:bg-white/10 transition-colors md:hidden"
        >
          <Menu className="w-4.5 h-4.5 text-white/60" />
        </button>
        <Hash className="w-4 h-4 text-white/40" />
        <span className="text-white font-semibold text-sm truncate">{channelName}</span>
        {isArchived && (
          <span className="flex items-center gap-1 text-xs text-amber-400/70 bg-amber-400/10 px-2 py-0.5 rounded-full flex-shrink-0">
            <Archive className="w-3 h-3" />
            アーカイブ済み
          </span>
        )}
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <Hash className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">まだメッセージがありません</p>
            <p className="text-xs mt-1 opacity-60">最初のメッセージを送りましょう</p>
          </div>
        ) : (
          <div>
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const isFirst =
                !prev ||
                prev.userId !== msg.userId ||
                new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000;
              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isFirst={isFirst}
                  channelId={channelId}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              );
            })}
            <div ref={bottomRef} className="h-2" />
          </div>
        )}
      </div>

      {/* 入力エリア */}
      <MessageInput onSend={handleSend} channelName={channelName} isArchived={isArchived} />
    </div>
  );
}
