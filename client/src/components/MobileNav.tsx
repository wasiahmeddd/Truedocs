import { Link, useLocation } from "wouter";
import { Home as HomeIcon, CreditCard, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Do not show on landing, auth, or admin
  if (!user || user.isAdmin || location === "/" || location === "/auth" || location === "/admin") {
    return null;
  }

  const isHome = location === "/home" || location === "/";
  const isCards = location.startsWith("/cards");
  const isPeople = location.startsWith("/people");

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-slate-950/90 backdrop-blur-2xl rounded-t-xl border-t border-slate-800">
      <Link href="/home" className={`flex flex-col items-center justify-center rounded-xl px-4 py-2 transition-all duration-200 active:scale-[0.98] ${isHome ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:bg-slate-800/40'}`}>
        <HomeIcon className={`h-6 w-6 ${isHome ? 'text-blue-400' : ''}`} />
        <span className="text-[10px] font-medium tracking-[0.05em] uppercase mt-1">Home</span>
      </Link>
      <Link href="/cards" className={`flex flex-col items-center justify-center rounded-xl px-4 py-2 transition-all duration-200 active:scale-[0.98] ${isCards ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:bg-slate-800/40'}`}>
        <CreditCard className={`h-6 w-6 ${isCards ? 'text-cyan-400' : ''}`} />
        <span className="text-[10px] font-medium tracking-[0.05em] uppercase mt-1">Cards</span>
      </Link>
      <Link href="/people" className={`flex flex-col items-center justify-center rounded-xl px-4 py-2 transition-all duration-200 active:scale-[0.98] ${isPeople ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:bg-slate-800/40'}`}>
        <Users className={`h-6 w-6 ${isPeople ? 'text-emerald-400' : ''}`} />
        <span className="text-[10px] font-medium tracking-[0.05em] uppercase mt-1">People</span>
      </Link>
    </nav>
  );
}
