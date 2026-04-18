import { useState } from "react";
import {
  Heart, MessageSquare, Share2, Bookmark, MoreHorizontal,
  ExternalLink, Check, MapPin, Briefcase,
} from "lucide-react";
import { COMMUNITIES } from "@/lib/communities";
import type { Post } from "@/lib/types";
import type { PostComment as Comment } from "@/lib/types";

function CommunityBadge({ id }: { id: string }) {
  const c = COMMUNITIES.find((x) => x.id === id);
  if (!c) return null;
  return <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{c.emoji} {c.name}</span>;
}

function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const [liked, setLiked] = useState(comment.liked);
  const [likes, setLikes] = useState(comment.likes);
  const [showReply, setShowReply] = useState(false);

  const toggleLike = () => {
    setLiked(!liked);
    setLikes((p) => (liked ? p - 1 : p + 1));
  };

  return (
    <div className={`${depth > 0 ? "ml-8 border-l-2 border-border pl-4" : ""}`}>
      <div className="flex gap-2 py-2">
        <img src={comment.author.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
          </div>
          <p className="text-sm text-foreground/80 mt-0.5">{comment.content}</p>
          <div className="flex items-center gap-3 mt-1">
            <button onClick={toggleLike} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
              <Heart className={`w-3 h-3 ${liked ? "fill-destructive text-destructive" : ""}`} />
              {likes}
            </button>
            {depth < 1 && (
              <button onClick={() => setShowReply(!showReply)} className="text-xs text-muted-foreground hover:text-foreground">
                Reply
              </button>
            )}
          </div>
          {showReply && (
            <div className="mt-2 flex gap-2">
              <input className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-input bg-background text-foreground input-glow focus:outline-none" placeholder="Write a reply..." />
              <button className="text-xs px-3 py-1.5 bg-primary-glow text-primary-foreground rounded-lg hover:bg-primary-glow/90">Reply</button>
            </div>
          )}
        </div>
      </div>
      {comment.replies?.map((r) => <CommentItem key={r.id} comment={r} depth={depth + 1} />)}
    </div>
  );
}

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [bookmarked, setBookmarked] = useState(post.bookmarked);
  const [showComments, setShowComments] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [votedOption, setVotedOption] = useState<number | null>(null);

  const toggleLike = () => {
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 300);
    setLiked(!liked);
    setLikes((p) => (liked ? p - 1 : p + 1));
  };

  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden scroll-reveal revealed">
      {/* Header */}
      <div className="px-4 pt-4 flex items-start gap-3">
        <img src={post.author.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm">{post.author.name}</span>
            {post.author.role && <span className="text-xs text-muted-foreground">· {post.author.role}</span>}
            <CommunityBadge id={post.community} />
          </div>
          <span className="text-xs text-muted-foreground">{post.createdAt}</span>
        </div>
        <button className="p-1 rounded hover:bg-secondary transition-colors"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="text-sm text-foreground whitespace-pre-line">{post.content}</p>

        {/* Hashtags */}
        {post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.hashtags.map((h) => (
              <span key={h} className="text-xs text-primary-glow font-medium cursor-pointer hover:underline">#{h}</span>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className={`grid gap-0.5 ${post.images.length === 1 ? "grid-cols-1" : post.images.length === 2 ? "grid-cols-2" : "grid-cols-2"}`}>
          {post.images.slice(0, 4).map((img, i) => (
            <div key={i} className="relative">
              <img src={img} alt="" className="w-full h-48 object-cover" loading="lazy" />
              {i === 3 && post.images!.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">+{post.images!.length - 4}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Project showcase */}
      {post.project && (
        <div className="mx-4 mb-2 rounded-lg border border-border overflow-hidden">
          <img src={post.project.cover} alt="" className="w-full h-40 object-cover" loading="lazy" />
          <div className="p-3">
            <h4 className="font-semibold text-foreground text-sm">{post.project.title}</h4>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {post.project.skills.map((s) => <span key={s} className="px-2 py-0.5 rounded-full bg-secondary text-xs text-secondary-foreground">{s}</span>)}
            </div>
            <button className="flex items-center gap-1 text-xs text-primary-glow mt-2 hover:underline"><ExternalLink className="w-3 h-3" />View Project</button>
          </div>
        </div>
      )}

      {/* Job posting */}
      {post.job && (
        <div className="mx-4 mb-2 p-4 rounded-lg border border-hrconnect/20 bg-hrconnect/5">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-hrconnect" />
            <span className="font-semibold text-foreground text-sm">{post.job.role}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span>{post.job.company}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{post.job.location}</span>
            <span>{post.job.type}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {post.job.requirements.map((r) => <span key={r} className="px-2 py-0.5 rounded-full bg-secondary text-xs text-secondary-foreground">{r}</span>)}
          </div>
          <button className="mt-3 px-4 py-1.5 bg-hrconnect text-primary-foreground rounded-lg text-xs font-medium hover:bg-hrconnect/90">Apply Now</button>
        </div>
      )}

      {/* Poll */}
      {post.poll && (
        <div className="mx-4 mb-2 space-y-2">
          {post.poll.options.map((opt, i) => {
            const pct = Math.round((opt.votes / post.poll!.totalVotes) * 100);
            const isVoted = votedOption === i;
            return (
              <button
                key={i}
                onClick={() => setVotedOption(i)}
                className={`w-full relative overflow-hidden rounded-lg border text-left p-3 text-sm transition-all ${
                  isVoted ? "border-primary-glow" : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-primary-glow/10 transition-all duration-500"
                  style={{ width: votedOption !== null ? `${pct}%` : "0%" }}
                />
                <div className="relative flex items-center justify-between">
                  <span className="text-foreground">{opt.text}</span>
                  {votedOption !== null && (
                    <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
                  )}
                </div>
                {isVoted && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-glow" />}
              </button>
            );
          })}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{post.poll.totalVotes} votes</span>
            <span>Ends in {post.poll.endsAt}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-destructive/10 ${liked ? "text-destructive" : "text-muted-foreground"}`}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${liked ? "fill-destructive" : ""} ${likeAnim ? "scale-150" : "scale-100"}`}
              style={{ transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
            />
            <span className="transition-all">{likes}</span>
          </button>
          <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors">
            <MessageSquare className="w-4 h-4" /> {post.comments_count ?? 0}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors">
            <Share2 className="w-4 h-4" /> {}
          </button>
        </div>
        <button onClick={() => setBookmarked(!bookmarked)} className={`p-1.5 rounded-lg transition-colors ${bookmarked ? "text-primary-glow" : "text-muted-foreground hover:bg-secondary"}`}>
          <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-primary-glow" : ""}`} />
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-1">
          {(post.comments_count ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No comments yet. Be the first!</p>
          ) : (
            <p className="text-sm text-muted-foreground py-2">{post.comments_count} comment{post.comments_count !== 1 ? 's' : ''} — load them below</p>
          )}
          <div className="flex gap-2 mt-3">
            <input className="flex-1 text-sm px-3 py-2 rounded-lg border border-input bg-background text-foreground input-glow focus:outline-none" placeholder="Write a comment..." />
            <button className="px-4 py-2 bg-primary-glow text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-glow/90">Post</button>
          </div>
        </div>
      )}
    </article>
  );
}
