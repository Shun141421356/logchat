"use client";
import { useState } from "react";
import { Hash, Archive, Plus, ChevronDown, ChevronRight, LogOut, Trash2 } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthContext";

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
  channels: Channel[];
}

interface SidebarProps {
  groups: Group[];
  activeChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onCreateGroup: () => void;
  onCreateChannel: (groupId: string) => void;
  onArchiveChannel: (channelId: string, isArchived: boolean) => void;
  onDeleteGroup: (groupId: string) => void;
}

type ContextMenu =
  | { type: "channel"; x: number; y: number; channelId: string; isArchived: boolean }
  | { type: "group"; x: number; y: number; groupId: string };

export function Sidebar({
  groups,
  activeChannelId,
  onSelectChannel,
  onCreateGroup,
  onCreateChannel,
  onArchiveChannel,
  onDeleteGroup,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.map((g) => g.id))
  );
  const [showArchived, setShowArchived] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleArchived = (groupId: string) => {
    setShowArchived((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <div
      className="w-60 flex-shrink-0 flex flex-col bg-[#181828] border-r border-white/[0.06] h-screen"
      onClick={() => setContextMenu(null)}
    >
      {/* ロゴ */}
      <div className="px-4 py-[14px] border-b border-white/[0.06] flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
          <span className="text-white text-[10px] font-bold tracking-tight">LC</span>
        </div>
        <span className="text-white/80 font-semibold text-sm tracking-wide">LogChat</span>
      </div>

      {/* グループ・チャンネルリスト */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {groups.length === 0 && (
          <p className="text-white/20 text-xs px-4 py-3">グループを作成して始めましょう</p>
        )}

        {groups.map((group) => {
          const activeChannels = group.channels.filter((c) => !c.isArchived);
          const archivedChannels = group.channels.filter((c) => c.isArchived);
          const isExpanded = expandedGroups.has(group.id);
          const showingArchived = showArchived.has(group.id);

          return (
            <div key={group.id} className="mb-0.5">
              {/* グループヘッダー */}
              <div className="flex items-center gap-1 px-2 py-1.5 group">
                <button
                  onClick={() => toggleGroup(group.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ type: "group", x: e.clientX, y: e.clientY, groupId: group.id });
                  }}
                  className="flex items-center gap-1 flex-1 min-w-0 rounded px-1 py-0.5 hover:bg-white/5 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-white/30 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-white/30 flex-shrink-0" />
                  )}
                  <span className="text-[11px] font-semibold text-white/40 uppercase tracking-widest truncate">
                    {group.name}
                  </span>
                </button>
                <button
                  onClick={() => onCreateChannel(group.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 transition-all"
                  title="チャンネルを追加"
                >
                  <Plus className="w-3 h-3 text-white/40" />
                </button>
              </div>

              {/* チャンネルリスト */}
              {isExpanded && (
                <div>
                  {activeChannels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => onSelectChannel(ch.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ type: "channel", x: e.clientX, y: e.clientY, channelId: ch.id, isArchived: ch.isArchived });
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-1.5 text-[13px] rounded-md mx-1 transition-all",
                        "w-[calc(100%-8px)]",
                        activeChannelId === ch.id
                          ? "bg-indigo-600/25 text-white"
                          : "text-white/45 hover:text-white/75 hover:bg-white/[0.06]"
                      )}
                    >
                      <Hash className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                      <span className="truncate">{ch.name}</span>
                    </button>
                  ))}

                  {archivedChannels.length > 0 && (
                    <div className="mt-0.5">
                      <button
                        onClick={() => toggleArchived(group.id)}
                        className="flex items-center gap-1.5 px-4 py-1 text-[11px] text-white/25 hover:text-white/45 transition-colors w-full"
                      >
                        <Archive className="w-3 h-3" />
                        アーカイブ ({archivedChannels.length})
                      </button>
                      {showingArchived &&
                        archivedChannels.map((ch) => (
                          <button
                            key={ch.id}
                            onClick={() => onSelectChannel(ch.id)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextMenu({ type: "channel", x: e.clientX, y: e.clientY, channelId: ch.id, isArchived: ch.isArchived });
                            }}
                            className={cn(
                              "w-[calc(100%-8px)] mx-1 flex items-center gap-2 px-3 py-1.5 text-[13px] rounded-md transition-all opacity-50",
                              activeChannelId === ch.id
                                ? "bg-indigo-600/15 text-white"
                                : "text-white/35 hover:text-white/55 hover:bg-white/5"
                            )}
                          >
                            <Archive className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                            <span className="truncate line-through">{ch.name}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* グループ追加ボタン */}
        <button
          onClick={onCreateGroup}
          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-white/25 hover:text-white/50 transition-colors mt-1 rounded-md hover:bg-white/5 mx-1 w-[calc(100%-8px)]"
        >
          <Plus className="w-3.5 h-3.5" />
          グループを追加
        </button>
      </div>

      {/* ユーザー情報 */}
      <div className="px-3 py-3 border-t border-white/[0.06] flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 select-none"
          style={{ backgroundColor: user?.avatarColor }}
        >
          {getInitials(user?.username || "?")}
        </div>
        <span className="text-white/60 text-sm truncate flex-1">{user?.username}</span>
        <button
          onClick={logout}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
          title="ログアウト"
        >
          <LogOut className="w-3.5 h-3.5 text-white/30 hover:text-white/60 transition-colors" />
        </button>
      </div>

      {/* コンテキストメニュー */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-[#24243a] border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[170px] overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === "channel" && (
            <button
              onClick={() => {
                onArchiveChannel(contextMenu.channelId, !contextMenu.isArchived);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-white/65 hover:bg-white/8 hover:text-white transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              {contextMenu.isArchived ? "アーカイブを解除" : "アーカイブする"}
            </button>
          )}
          {contextMenu.type === "group" && (
            <button
              onClick={() => {
                if (confirm("このグループとすべてのチャンネル・メッセージを削除しますか？")) {
                  onDeleteGroup(contextMenu.groupId);
                }
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              グループを削除
            </button>
          )}
        </div>
      )}
    </div>
  );
}
