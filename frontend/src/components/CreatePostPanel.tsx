import { useState, useRef } from "react";
import {
  Image, Hash, AtSign, Smile, BarChart3, FileText,
  Globe, Lock, Users, Calendar, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMMUNITIES } from "@/lib/communities";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePostMutation } from "@/hooks/api/useFeed";

interface Props {
  community?: string;
  communitySlug?: string;
  onClose?: () => void;
}

export default function CreatePostPanel({ community, communitySlug, onClose }: Props) {
  const { user } = useAuth();
  const defaultComm = communitySlug || community || COMMUNITIES[0].id;
  const [content, setContent]                 = useState("");
  const [selectedCommunity, setSelectedComm]  = useState(defaultComm);
  const [visibility, setVisibility]           = useState<"public" | "community" | "connections">("public");
  const fileRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePostMutation();

  const maxChars = 2000;

  const handlePost = async () => {
    if (!content.trim()) return;
    const form = new FormData();
    form.append("content", content.trim());
    form.append("type", "text");
    form.append("visibility", visibility);
    const comm = COMMUNITIES.find((c) => c.id === selectedCommunity);
    // We don't have community_id here without an API call — post without community_id for now
    // The backend will set community to null which is valid for feed-wide posts
    await createPost.mutateAsync(form);
    setContent("");
    onClose?.();
  };

  const avatarUrl = user?.avatar_url
    || `https://ui-avatars.com/api/?name=${user?.first_name ?? "U"}&background=14b8a6&color=fff&size=32`;

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">
              {user ? `${user.first_name} ${user.last_name}` : "You"}
            </div>
            <select
              value={selectedCommunity}
              onChange={(e) => setSelectedComm(e.target.value)}
              className="text-xs text-muted-foreground bg-transparent border-none outline-none cursor-pointer"
            >
              {COMMUNITIES.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
        rows={4}
        className="w-full bg-transparent text-foreground text-sm resize-none focus:outline-none placeholder:text-muted-foreground"
        placeholder="What's on your mind?"
      />

      {/* Char count */}
      <div className="text-right text-xs text-muted-foreground mb-3">
        {content.length}/{maxChars}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-t border-border pt-3 mb-3">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" />
        {[
          { icon: Image, title: "Add image", action: () => fileRef.current?.click() },
          { icon: Hash,  title: "Add hashtag" },
          { icon: AtSign, title: "Mention" },
          { icon: Smile, title: "Emoji" },
          { icon: BarChart3, title: "Poll" },
          { icon: FileText, title: "Article" },
        ].map(({ icon: Icon, title, action }) => (
          <button key={title} onClick={action} className="p-2 rounded-lg hover:bg-secondary transition-colors" title={title}>
            <Icon className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}

        <div className="flex-1" />

        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as any)}
          className="text-xs px-2 py-1 rounded-lg border border-input bg-background text-foreground"
        >
          <option value="public">🌐 Public</option>
          <option value="community">👥 Community Only</option>
          <option value="connections">🔒 Connections</option>
        </select>
      </div>

      {/* Post button */}
      <div className="flex justify-end">
        <Button
          onClick={handlePost}
          disabled={!content.trim() || createPost.isPending}
          className="bg-primary-glow hover:bg-primary-glow/90 text-primary-foreground"
          size="sm"
        >
          {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
          Post
        </Button>
      </div>
    </div>
  );
}
