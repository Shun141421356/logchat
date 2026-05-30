"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChannelView } from "@/components/chat/ChannelView";
import { Modal } from "@/components/ui/Modal";
import { Hash, MessageSquare } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  description?: string | null;
  isArchived: boolean;
  groupId: string;
}

interface Group {
  id: string;
  name: string;
  description?: string | null;
  channels: Channel[];
}

export default function AppClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  const [groupModal, setGroupModal] = useState(false);
  const [channelModal, setChannelModal] = useState(false);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({ name: "", description: "" });
  const [channelForm, setChannelForm] = useState({ name: "", description: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const fetchGroups = useCallback(async () => {
    const res = await fetch("/api/groups");
    if (res.ok) {
      const data = await res.json();
      setGroups(data);
    }
  }, []);

  useEffect(() => {
    if (user) fetchGroups();
  }, [user, fetchGroups]);

  const activeChannel = groups
    .flatMap((g) => g.channels)
    .find((c) => c.id === activeChannelId);

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) return;
    setFormError("");
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(groupForm),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error); return; }
    setGroups((prev) => [...prev, data]);
    setGroupModal(false);
    setGroupForm({ name: "", description: "" });
  };

  const handleCreateChannel = async () => {
    if (!channelForm.name.trim() || !targetGroupId) return;
    setFormError("");
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...channelForm, groupId: targetGroupId }),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error); return; }
    setGroups((prev) =>
      prev.map((g) =>
        g.id === targetGroupId ? { ...g, channels: [...g.channels, data] } : g
      )
    );
    setActiveChannelId(data.id);
    setChannelModal(false);
    setChannelForm({ name: "", description: "" });
  };

  const handleArchiveChannel = async (channelId: string, isArchived: boolean) => {
    const res = await fetch(`/api/channels/${channelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived }),
    });
    if (res.ok) {
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          channels: g.channels.map((c) =>
            c.id === channelId ? { ...c, isArchived } : c
          ),
        }))
      );
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    if (res.ok) {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      if (groups.find((g) => g.id === groupId)?.channels.some((c) => c.id === activeChannelId)) {
        setActiveChannelId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#13131f]">
        <div className="w-8 h-8 border-2 border-indigo-500/50 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#13131f]">
      <Sidebar
        groups={groups}
        activeChannelId={activeChannelId}
        onSelectChannel={setActiveChannelId}
        onCreateGroup={() => { setGroupModal(true); setFormError(""); }}
        onCreateChannel={(groupId) => {
          setTargetGroupId(groupId);
          setChannelModal(true);
          setFormError("");
        }}
        onArchiveChannel={handleArchiveChannel}
        onDeleteGroup={handleDeleteGroup}
      />

      {activeChannel ? (
        <ChannelView
          key={activeChannelId!}
          channelId={activeChannelId!}
          channelName={activeChannel.name}
          isArchived={activeChannel.isArchived}
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5">
            <MessageSquare className="w-7 h-7 text-white/15" />
          </div>
          <p className="text-white/25 text-sm">チャンネルを選択してください</p>
        </div>
      )}

      {/* グループ作成モーダル */}
      <Modal isOpen={groupModal} onClose={() => setGroupModal(false)} title="グループを作成">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">グループ名 *</label>
            <input
              type="text"
              value={groupForm.name}
              onChange={(e) => setGroupForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="例：個人プロジェクト"
              onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none focus:border-indigo-500/50 transition-colors placeholder-white/20"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">説明（任意）</label>
            <input
              type="text"
              value={groupForm.description}
              onChange={(e) => setGroupForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="このグループについて..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none focus:border-indigo-500/50 transition-colors placeholder-white/20"
            />
          </div>
          {formError && <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg">{formError}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setGroupModal(false)} className="px-4 py-2 text-sm text-white/40 hover:text-white/60 transition-colors">
              キャンセル
            </button>
            <button
              onClick={handleCreateGroup}
              className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium"
            >
              作成
            </button>
          </div>
        </div>
      </Modal>

      {/* チャンネル作成モーダル */}
      <Modal isOpen={channelModal} onClose={() => setChannelModal(false)} title="チャンネルを作成">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">チャンネル名 *</label>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 focus-within:border-indigo-500/50 transition-colors">
              <Hash className="w-4 h-4 text-white/25 flex-shrink-0" />
              <input
                type="text"
                value={channelForm.name}
                onChange={(e) => setChannelForm((p) => ({ ...p, name: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                placeholder="例：daily-log"
                onKeyDown={(e) => e.key === "Enter" && handleCreateChannel()}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/20"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1.5 block">説明（任意）</label>
            <input
              type="text"
              value={channelForm.description}
              onChange={(e) => setChannelForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="このチャンネルについて..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm outline-none focus:border-indigo-500/50 transition-colors placeholder-white/20"
            />
          </div>
          {formError && <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-lg">{formError}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={() => setChannelModal(false)} className="px-4 py-2 text-sm text-white/40 hover:text-white/60 transition-colors">
              キャンセル
            </button>
            <button
              onClick={handleCreateChannel}
              className="px-5 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium"
            >
              作成
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
