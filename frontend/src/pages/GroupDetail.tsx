import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Users, MessageSquare, Shield, FileText, Info, ArrowLeft, Globe, Lock, Loader2, BookOpen } from "lucide-react";
import Navbar from "@/components/Navbar";
import { COMMUNITIES } from "@/lib/communities";
import { Button } from "@/components/ui/button";
import { useGroup, useJoinGroupMutation, useLeaveGroupMutation } from "@/hooks/api/useGroups";
import { useFeed } from "@/hooks/api/useFeed";
import PostCard from "@/components/PostCard";
import CreatePostPanel from "@/components/CreatePostPanel";
import { useAuth } from "@/contexts/AuthContext";

const TABS = ["Discussion", "Members", "About"];
const TAB_ICONS = [MessageSquare, Users, Info];

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();
  const joinMutation  = useJoinGroupMutation();
  const leaveMutation = useLeaveGroupMutation();

  const groupId = id ? parseInt(id) : 0;
  const { data, isLoading, error } = useGroup(groupId);
  const group = data?.group;
  const membership = data?.membership;

  // Feed filtered to this community
  const communitySlug = group?.community?.slug;
  const feedQuery = useFeed(communitySlug ? { community: communitySlug } : undefined);
  const posts = feedQuery.data?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) return (
    <><Navbar />
    <div className="page-enter pt-20 flex justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-primary-glow" />
    </div></>
  );

  if (error || !group) return (
    <><Navbar />
    <main className="page-enter pt-20 pb-16 container mx-auto px-4 text-center">
      <p className="text-muted-foreground">Group not found.</p>
      <Link to="/groups" className="text-primary-glow hover:underline text-sm mt-2 inline-block">← Back to Groups</Link>
    </main></>
  );

  const comm = COMMUNITIES.find((c) => c.id === group.community?.slug);
  const isMember = !!membership || group.is_member;
  const isAdmin  = membership?.role === 'admin' || membership?.role === 'moderator';
  const TypeIcon = group.type === 'private' ? Lock : Globe;

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4">
          <Link to="/groups" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Groups
          </Link>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left sidebar */}
            <aside className="lg:w-80 shrink-0 space-y-4">
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {group.cover_url && <img src={group.cover_url} alt="" className="w-full h-40 object-cover" />}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h1 className="text-xl font-bold text-foreground">{group.name}</h1>
                    <TypeIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                  {comm && (
                    <Link to={`/communities/${comm.id}`} className="inline-flex items-center gap-1.5 text-sm text-primary-glow hover:underline mb-3">
                      <span>{comm.emoji}</span>{comm.name}
                    </Link>
                  )}
                  {group.description && <p className="text-sm text-muted-foreground mb-4">{group.description}</p>}

                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{group.members_count ?? 0}</span>
                    <span className="capitalize">{group.type}</span>
                  </div>

                  {user && (
                    isMember ? (
                      <button onClick={() => leaveMutation.mutate(groupId)}
                        disabled={leaveMutation.isPending}
                        className="w-full py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all">
                        {leaveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Leave Group'}
                      </button>
                    ) : (
                      <button onClick={() => joinMutation.mutate(groupId)}
                        disabled={joinMutation.isPending}
                        className="w-full py-2 rounded-xl bg-primary-glow text-primary-foreground text-sm font-semibold hover:bg-primary-glow/90 transition-all">
                        {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Join Group'}
                      </button>
                    )
                  )}
                </div>
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Tabs */}
              <div className="flex gap-1 mb-5 bg-secondary/50 rounded-xl p-1">
                {TABS.map((tab, i) => {
                  const Icon = TAB_ICONS[i];
                  return (
                    <button key={tab} onClick={() => setActiveTab(i)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium flex-1 justify-center transition-all ${activeTab === i ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      <Icon className="w-4 h-4" />{tab}
                    </button>
                  );
                })}
              </div>

              {activeTab === 0 && (
                <div className="space-y-4">
                  {isMember && <CreatePostPanel communitySlug={communitySlug} />}
                  {feedQuery.isLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-glow" /></div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No posts yet. Start the conversation!</p>
                    </div>
                  ) : (
                    posts.map((post: any) => <PostCard key={post.id} post={post} />)
                  )}
                </div>
              )}

              {activeTab === 1 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-sm text-muted-foreground">
                    {group.members_count ?? 0} member{(group.members_count ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {activeTab === 2 && (
                <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                  <h3 className="font-semibold text-foreground">About this Group</h3>
                  {group.description && <p className="text-sm text-muted-foreground">{group.description}</p>}
                  <p className="text-sm text-muted-foreground">Type: <span className="capitalize text-foreground">{group.type}</span></p>
                  <p className="text-sm text-muted-foreground">Created: {new Date(group.created_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
