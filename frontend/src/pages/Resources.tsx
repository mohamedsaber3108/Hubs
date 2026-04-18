import { useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { BookOpen, Loader2, Download, Star, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useResources } from "@/hooks/api/useResources";
import { resourceService } from "@/services/resource.service";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Resource } from "@/lib/types";

const TYPES = ['all', 'pdf', 'video', 'tool', 'link', 'course', 'ebook', 'template'];
const TYPE_ICONS: Record<string, string> = { pdf: '📄', video: '🎥', tool: '🔧', link: '🔗', course: '🎓', ebook: '📚', template: '📋', doc: '📝' };

function ResourceCard({ resource, onDownload }: { resource: Resource; onDownload: () => void }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary-glow/30 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
          {TYPE_ICONS[resource.type] || '📄'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground text-sm line-clamp-2">{resource.title}</h3>
            {resource.is_free ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 flex-shrink-0">Free</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground flex-shrink-0">Paid</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{resource.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{resource.avg_rating?.toFixed(1) || '—'}</span>
            <span className="flex items-center gap-0.5"><Download className="w-3 h-3" />{resource.downloads_count}</span>
            <span className="capitalize">{resource.type}</span>
          </div>
        </div>
      </div>
      <button onClick={onDownload}
        className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-sm rounded-lg bg-primary-glow/10 text-primary-glow hover:bg-primary-glow/20 transition-colors">
        {resource.file_url ? <><Download className="w-4 h-4" /> Download</> : <><ExternalLink className="w-4 h-4" /> Open Link</>}
      </button>
    </div>
  );
}

export default function Resources() {
  const { community }     = useParams<{ community: string }>();
  const { isLoggedIn }    = useAuth();
  const [type, setType]   = useState('all');
  const [freeOnly, setFreeOnly] = useState(false);

  const params = { community, type: type !== 'all' ? type : undefined, is_free: freeOnly ? 'true' : undefined };
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useResources(params);

  const resources = data?.pages.flatMap((p) => p.data) ?? [];
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (isFetchingNextPage) return;
    observerRef.current?.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver((e) => { if (e[0].isIntersecting && hasNextPage) fetchNextPage(); });
    observerRef.current.observe(node);
  }, [isFetchingNextPage, hasNextPage, fetchNextPage]);

  const handleDownload = async (resource: Resource) => {
    if (!isLoggedIn) { toast.error("Please sign in to download"); return; }
    try {
      const url = await resourceService.download(resource.id);
      window.open(url, '_blank');
    } catch { toast.error("Download failed"); }
  };

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Resources Library</h1>
            <p className="text-muted-foreground mt-1">Curated tools, guides, and courses for Arab professionals</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 mb-6">
            <div className="flex gap-2 flex-wrap items-center">
              {TYPES.map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs capitalize transition-all ${type === t ? 'bg-primary-glow text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                  {t === 'all' ? 'All Types' : t}
                </button>
              ))}
              <button onClick={() => setFreeOnly(!freeOnly)}
                className={`ms-auto px-3 py-1.5 rounded-full text-xs transition-all ${freeOnly ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
                Free only
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((r) => <ResourceCard key={r.id} resource={r} onDownload={() => handleDownload(r)} />)}
              {resources.length === 0 && (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No resources found</p>
                </div>
              )}
            </div>
          )}
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-primary-glow" />}
          </div>
        </div>
      </main>
    </>
  );
}
