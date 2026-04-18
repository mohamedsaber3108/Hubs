import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="relative mb-6">
          <div className="text-[120px] font-bold text-primary-glow/10 leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary-glow/10 flex items-center justify-center animate-bounce">
              <MapPin className="w-10 h-10 text-primary-glow" />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Lost in the Community?</h1>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-primary-glow text-primary-foreground hover:bg-primary-glow/90">
            <Link to="/"><Home className="w-4 h-4 mr-1" />Go Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/search"><Search className="w-4 h-4 mr-1" />Search</Link>
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />Go Back
          </Button>
        </div>
        <div className="mt-8 text-xs text-muted-foreground">
          <p>Try these popular pages:</p>
          <div className="flex gap-3 justify-center mt-2">
            <Link to="/dashboard" className="text-primary-glow hover:underline">Dashboard</Link>
            <Link to="/events" className="text-primary-glow hover:underline">Events</Link>
            <Link to="/feed" className="text-primary-glow hover:underline">Feed</Link>
            <Link to="/communities" className="text-primary-glow hover:underline">Communities</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
