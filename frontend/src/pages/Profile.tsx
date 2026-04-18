import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin, ExternalLink, Briefcase, Calendar, Trophy, Users,
  MessageSquare, Edit, Award, Loader2, UserPlus, Check,
  Linkedin, Github, Globe,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { COMMUNITIES } from "@/lib/communities";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/user.service";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const TABS = ["Overview", "Activity", "Badges"];

function CommunityBadge({ slug }: { slug: string }) {
  const c = COMMUNITIES.find((c) => c.id === slug);
  if (!c) return null;
  return (
    <Link to={`/communities/${c.id}`}
      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs hover:bg-primary-glow/10 hover:text-primary-glow transition-colors">
      <span>{c.emoji}</span>{c.name}
    </Link>
  );
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user: me, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [followed, setFollowed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => userService.getProfile(username!),
    enabled: !!username,
  });

  const isOwnProfile = me?.username === username;

  const handleFollow = async () => {
    if (!isLoggedIn || !profile) return;
    setFollowLoading(true);
    try {
      await userService.follow(profile.id);
      setFollowed(true);
      toast.success(`Following @${profile.username}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    } finally {
      setFollowLoading(false);
    }
  };

  if (isLoading) return (
    <><Navbar /><div className="page-enter pt-20 flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div></>
  );

  if (error || !profile) return (
    <><Navbar /><main className="page-enter pt-20 pb-16 container mx-auto px-4 text-center">
      <p className="text-muted-foreground">User not found.</p>
      <Link to="/" className="text-primary-glow hover:underline text-sm mt-2 inline-block">← Home</Link>
    </main></>
  );

  const communities: string[] = profile.communities?.map((c: any) => c.slug || c) ?? [];

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-20 md:pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Cover */}
          <div className="relative h-40 md:h-52 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-glow/30 to-secondary mb-16">
            {profile.cover_url && <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />}
            {/* Avatar */}
            <div className="absolute -bottom-12 left-6">
              <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.first_name}&background=14b8a6&color=fff&size=96`}
                alt="" className="w-24 h-24 rounded-2xl border-4 border-background object-cover" />
            </div>
          </div>

          {/* Profile header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{profile.first_name} {profile.last_name}</h1>
              <p className="text-muted-foreground text-sm">@{profile.username}</p>
              {profile.headline && <p className="text-sm text-foreground/80 mt-1">{profile.headline}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.location}</span>}
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{profile.followers_count ?? 0} followers</span>
                <span>{profile.following_count ?? 0} following</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isOwnProfile ? (
                <Button asChild size="sm" variant="outline">
                  <Link to="/profile/edit"><Edit className="w-4 h-4 mr-1.5" />Edit Profile</Link>
                </Button>
              ) : (
                <>
                  {isLoggedIn && (
                    <button onClick={handleFollow} disabled={followed || followLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        followed ? 'bg-secondary text-muted-foreground' : 'bg-primary-glow text-primary-foreground hover:bg-primary-glow/90'}`}>
                      {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : followed ? <Check className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      {followed ? 'Following' : 'Follow'}
                    </button>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <Link to="/messages"><MessageSquare className="w-4 h-4 mr-1.5" />Message</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Social links */}
          {(profile.website || profile.linkedin_url || profile.github_url) && (
            <div className="flex flex-wrap gap-3 mb-6">
              {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary-glow transition-colors"><Globe className="w-4 h-4" />Website</a>}
              {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary-glow transition-colors"><Linkedin className="w-4 h-4" />LinkedIn</a>}
              {profile.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary-glow transition-colors"><Github className="w-4 h-4" />GitHub</a>}
            </div>
          )}

          {/* Communities */}
          {communities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {communities.map((slug) => <CommunityBadge key={slug} slug={slug} />)}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-secondary/50 rounded-xl p-1 w-fit">
            {TABS.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === i ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 0 && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {profile.bio && (
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold text-foreground mb-3">About</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{profile.bio}</p>
                  </div>
                )}

                {profile.experiences && profile.experiences.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary-glow" />Experience</h3>
                    <div className="space-y-4">
                      {profile.experiences.map((exp: any) => (
                        <div key={exp.id} className="flex gap-3">
                          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 text-base">
                            {exp.company_logo ? <img src={exp.company_logo} alt="" className="w-7 h-7 object-contain" /> : <Briefcase className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{exp.title}</p>
                            <p className="text-sm text-muted-foreground">{exp.company}</p>
                            <p className="text-xs text-muted-foreground">{exp.start_date} – {exp.end_date || 'Present'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.skills && profile.skills.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="font-semibold text-foreground mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((s: any) => (
                        <span key={s.name || s} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">{s.name || s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-semibold text-foreground mb-4 text-sm">Stats</h3>
                  {[
                    { label: 'Points',    val: profile.points_total ?? 0, icon: Trophy },
                    { label: 'Followers', val: profile.followers_count ?? 0, icon: Users },
                    { label: 'Following', val: profile.following_count ?? 0, icon: UserPlus },
                    { label: 'Member since', val: new Date(profile.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' }), icon: Calendar },
                  ].map(({ label, val, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="w-3.5 h-3.5" />{label}</span>
                      <span className="text-sm font-semibold text-foreground">{typeof val === 'number' ? val.toLocaleString() : val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Activity feed coming soon.</p>
            </div>
          )}

          {activeTab === 2 && (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground">
              <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Badges earned will appear here.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
