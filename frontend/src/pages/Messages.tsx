import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageSquare, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useConversations, useMessages, useSendMessageMutation } from "@/hooks/api/useMessages";
import { getChatSocket } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatMessage, Conversation } from "@/lib/types";

function Avatar({ src, name }: { src?: string | null; name: string }) {
  return (
    <img
      src={src || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=14b8a6&color=fff`}
      alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0"
    />
  );
}

export default function Messages() {
  const { user }     = useAuth();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [inputText, setInput]   = useState("");
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const bottomRef    = useRef<HTMLDivElement>(null);

  const { data: convData, isLoading: loadingConvs } = useConversations();
  const { data: msgData, isLoading: loadingMsgs }   = useMessages(activeId || 0);
  const { mutate: sendMsg, isPending: sending }      = useSendMessageMutation(activeId || 0);

  const conversations: Conversation[] = convData?.data ?? [];
  const messages: ChatMessage[] = msgData?.pages.flatMap((p) => p.data) ?? [];
  const allMessages = [...messages, ...localMessages];

  // Socket.io: join room + listen for new messages
  useEffect(() => {
    if (!activeId) return;
    const socket = getChatSocket();
    if (!socket.connected) socket.connect();
    socket.emit("join-conversation", activeId);
    socket.on("new-message", (msg: ChatMessage) => {
      if (msg.conversation_id === activeId && msg.sender?.id !== user?.id) {
        setLocalMessages((prev) => [...prev, msg]);
      }
    });
    return () => { socket.off("new-message"); };
  }, [activeId, user?.id]);

  // Clear local messages when switching conversation
  useEffect(() => { setLocalMessages([]); }, [activeId]);

  // Scroll to bottom
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [allMessages]);

  const handleSend = () => {
    if (!inputText.trim() || !activeId || sending) return;
    const text = inputText;
    setInput("");
    sendMsg(text, {
      onSuccess: (msg) => setLocalMessages((prev) => [...prev, msg]),
    });
  };

  // Get other participant name/avatar for a conversation
  const getOther = (conv: Conversation) => {
    const other = conv.participants.find((p) => p.user_id !== user?.id);
    return other?.user;
  };

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <>
      <Navbar />
      <main className="page-enter pt-16 h-screen flex flex-col">
        <div className="flex flex-1 min-h-0 container mx-auto px-4 py-4 gap-4 max-w-5xl">
          {/* Conversations list */}
          <div className="w-72 flex-shrink-0 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-bold text-foreground">Messages</h2>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input placeholder="Search…" className="w-full pl-9 pr-3 py-2 text-sm bg-secondary rounded-lg border-0 focus:outline-none text-foreground placeholder:text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary-glow" /></div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : conversations.map((conv) => {
                const other = getOther(conv);
                const isActive = conv.id === activeId;
                return (
                  <button key={conv.id} onClick={() => setActiveId(conv.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-start hover:bg-secondary/50 transition-colors ${isActive ? "bg-secondary" : ""}`}>
                    <Avatar src={other?.avatar_url} name={`${other?.first_name} ${other?.last_name}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground text-sm truncate">{other?.first_name} {other?.last_name}</p>
                        {conv.unread_count > 0 && (
                          <span className="w-5 h-5 rounded-full bg-primary-glow text-primary-foreground text-xs flex items-center justify-center flex-shrink-0">{conv.unread_count}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.last_message?.content || "Start chatting"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col bg-card border border-border rounded-xl overflow-hidden">
            {!activeId ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Select a conversation</p>
                  <p className="text-sm mt-1">Or start a new one from someone's profile</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                {activeConv && (() => {
                  const other = getOther(activeConv);
                  return (
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                      <Avatar src={other?.avatar_url} name={`${other?.first_name} ${other?.last_name}`} />
                      <div>
                        <p className="font-semibold text-foreground text-sm">{other?.first_name} {other?.last_name}</p>
                        <p className="text-xs text-muted-foreground">@{other?.username}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMsgs ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary-glow" /></div>
                  ) : allMessages.map((msg) => {
                    const isMe = msg.sender?.id === user?.id;
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                        {!isMe && <Avatar src={msg.sender?.avatar_url} name={`${msg.sender?.first_name}`} />}
                        <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-primary-glow text-primary-foreground rounded-tr-sm" : "bg-secondary text-foreground rounded-tl-sm"}`}>
                          {msg.is_deleted ? <em className="opacity-60">Message deleted</em> : msg.content}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t border-border flex gap-2">
                  <input
                    value={inputText} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Type a message…"
                    className="flex-1 px-4 py-2.5 text-sm bg-secondary rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-primary-glow/30 text-foreground placeholder:text-muted-foreground"
                  />
                  <button onClick={handleSend} disabled={!inputText.trim() || sending}
                    className="w-10 h-10 rounded-full bg-primary-glow text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary-glow/90 transition-colors">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
