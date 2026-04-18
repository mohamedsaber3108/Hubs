import { useState, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Plus, TrendingUp, Calendar, Users, Loader2, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import CreatePostPanel from "@/components/CreatePostPanel";
import NotificationPanel from "@/components/NotificationPanel";
import { Button } from "@/components/ui/button";
import { useFeed, useCreatePostMutation, useLikePostMutation, useDeletePostMutation } from "@/hooks/api/useFeed";
import { useCommunity } from "@/hooks/api/useCommunities";
import { useAuth } from "@/contexts/AuthContext";
import { TRENDING_HASHTAGS } from "@/lib/mockFeedData"; // hashtags still mocked — fine

const FILTERS = ["All Posts", "Text", "Images", "Questions", "Polls", "Projects"];

// Map filter labels to API type values
const FILTER_MAP: Record<string, string | undefined> = {
  "All Posts": undefined, "Text": "text", "Images": "image",
  "Questions": "text", "Polls": "poll", "Projects": "article",
};

export default function Feed() {
  const { community }          = useParams<{ community: string }>();
  const activeCommunity        = community || "freelancespace";
  const [activeFilter, setActiveFilter] = useState("All Posts");
  const [showCompose, setShowCompose]   = useState(false);
  const { user, isLoggedIn }   = useAuth();

  const feedParams = {
    community:   activeCommunity !== "all" ? activeCommunity : undefined,
    type:        FILTER_MAP[activeFilter],
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useFeed(feedParams);
  const { data: communityData } = useCommunity(activeCommunity);
  const { mutate: likePost }    = useLikePostMutation();
  const { mutate: deletePost }  = useDeletePostMutation();

  const posts = data?.pages.flatMap((p) => p.data) ?? [];
  const trending = (TRENDING_HASHTAGS as any)[activeCommunity] || (TRENDING_HASHTAGS as any).freelancespace;

  // Infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return;
    observerRef.current?.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
    });
    observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex gap-6">
            {/* Left sidebar */}
            <aside className="hidden lg:block w-64 shrink-0 space-y-4 sticky top-24 self-start">
              <div className="bg-card border border-border rounded-xl p-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.first_name}&background=14b8a6&color=fff`} alt="" className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <div className="font-medium text-foreground text-sm">{user.first_name} {user.last_name}</div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div><div className="font-bold text-foreground">{user.points_total}</div><div className="text-muted-foreground">Points</div></div>
                      <div><div className="font-bold text-foreground">{user.followers_count}</div><div className="text-muted-foreground">Follows</div></div>
                      <div><div className="font-bold text-foreground">{user.communities_joined}</div><div className="text-muted-foreground">Comm.</div></div>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">Sign in to join the conversation</p>
                    <Link to="/auth/signin"><Button size="sm" className="w-full bg-primary-glow text-primary-foreground">Sign In</Button></Link>
                  </div>
                )}
              </div>

              {/* Trending */}
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-primary-glow" />
                  <span className="font-semibold text-sm text-foreground">Trending</span>
                </div>
                <div className="space-y-1.5">
                  {trending.slice(0, 6).map((tag: any) => (
                    <div key={tag.tag} className="flex items-center justify-between text-xs">
                      <span className="text-primary-glow font-medium">#{tag.tag}</span>
                      <span className="text-muted-foreground">{tag.posts}+ posts</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main feed */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Community header */}
              {communityData && (
                <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                  <span className="text-3xl">{communityData.emoji}</span>
                  <div>
                    <h1 className="font-bold text-foreground">{communityData.name}</h1>
                    <p className="text-xs text-muted-foreground">{communityData.members_count?.toLocaleString()} members</p>
                  </div>
                </div>
              )}

              {/* Compose bar */}
              {isLoggedIn && (
                <div className="bg-card border border-border rounded-xl p-4">
                  <button onClick={() => setShowCompose(true)} className="w-full flex items-center gap-3 text-start">
                    <img src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.first_name}&background=14b8a6&color=fff`} alt="" className="w-9 h-9 rounded-full object-cover" />
                    <span className="flex-1 px-4 py-2.5 rounded-full bg-secondary text-sm text-muted-foreground">What's on your mind?</span>
                    <Button size="sm" className="gap-2 bg-primary-glow text-primary-foreground">
                      <Plus className="w-4 h-4" /> Post
                    </Button>
                  </button>
                </div>
              )}

              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {FILTERS.map((f) => (
                  <button key={f} onClick={() => setActiveFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${activeFilter === f ? "bg-primary-glow text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
                    {f}
                  </button>
                ))}
              </div>

              {/* Posts */}
              {isLoading && (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-glow" />
                </div>
              )}
              {isError && (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8" />
                  <p>Failed to load posts. Please try again.</p>
                </div>
              )}
              {!isLoading && posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    id: String(post.id), author: { id: String(post.author.id), name: `${post.author.first_name} ${post.author.last_name}`, username: post.author.username, avatar: post.author.avatar_url || `https://ui-avatars.com/api/?name=${post.author.first_name}&background=14b8a6&color=fff`, community: post.community?.slug || '' },
                    content: post.content, type: post.type as any,
                    likes: post.likes_count, comments: post.comments_count,
                    liked: post.liked || false, saved: false, pinned: post.is_pinned,
                    time: post.created_at, community: post.community?.slug || '', media: post.media_urls,
                    tags: [],
                  }}
                  onLike={() => likePost(post.id)}
                  onDelete={user?.id === post.author.id ? () => deletePost(post.id) : undefined}
                />
              ))}
              {!isLoading && posts.length === 0 && !isError && (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-lg font-medium mb-2">No posts yet</p>
                  <p className="text-sm">Be the first to post in this community!</p>
                </div>
              )}
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-primary-glow" />}
              </div>
            </div>

            {/* Right sidebar */}
            <aside className="hidden xl:block w-72 shrink-0 sticky top-24 self-start">
              <NotificationPanel />
            </aside>
          </div>
        </div>
      </main>

      {showCompose && (
        <CreatePostPanel
          communitySlug={activeCommunity}
          onClose={() => setShowCompose(false)}
        />
      )}
    </>
  );
}
