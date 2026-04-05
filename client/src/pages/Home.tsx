import { Link } from "wouter";
import { Users, CreditCard, ChevronRight, LogOut, ShieldCheck, Shield, Lock, IdCard as BadgeIcon, Plane, Home as HomeIcon, User, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { ProfileDialog } from "@/components/ProfileDialog";
import { useAuth } from "@/context/AuthContext";
import { usePeople } from "@/hooks/use-people";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CryptoWalletDrawer } from "@/components/CryptoWalletDrawer";
import { TransferAllDataCard } from "@/components/TransferAllDataCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Home() {
  const { logout } = useAuth();
  const { data: allPeople } = usePeople();
  const totalCards = allPeople?.reduce((sum, p) => sum + p.cards.length, 0) || 0;
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <>
      <div className="hidden md:flex min-h-screen bg-background flex-col relative overflow-hidden">
        {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      {/* Top Navigation Bar */}
      <div className="w-full flex items-center justify-between p-4 md:p-6 z-20">
        {/* Mobile Title (Small) - Visible only on very small screens if needed, or just keep spacing */}
        <div className="md:hidden"></div>

        {/* User Actions - Now relative in flow */}
        <div className="flex items-center gap-2 ml-auto">
          <ProfileDialog />
          <ChangePasswordDialog />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                title="Logout"
                className="rounded-full bg-background/50 backdrop-blur-sm border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive hover:scale-105 transition-all shadow-sm"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log out of Vault?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will need to enter your credentials to access your documents again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => logout()} className="bg-destructive hover:bg-destructive/90">
                  Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Content Centered */}
      <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-6 w-full max-w-4xl mx-auto z-10 space-y-8 md:space-y-12 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            Govt Cards <br className="md:hidden" /> <span className="text-primary">Organiser</span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Securely manage and access your essential government identification documents in one organized place.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-10 w-full"
        >
          <Link href="/people" className="group block">
            <motion.div variants={item} className="h-full bg-card hover:bg-accent/5 border border-border rounded-3xl p-6 md:p-12 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center gap-4 md:gap-6 group">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold group-hover:text-primary transition-colors">Browse by People</h2>
                <p className="text-sm md:text-base text-muted-foreground">View documents organized by family member or individual.</p>
              </div>
              <div className="mt-auto pt-2 md:pt-4 flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                View People <ChevronRight className="ml-1 h-4 w-4" />
              </div>
            </motion.div>
          </Link>

          <Link href="/cards" className="group block">
            <motion.div variants={item} className="h-full bg-card hover:bg-accent/5 border border-border rounded-3xl p-6 md:p-12 transition-all duration-300 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center gap-4 md:gap-6 group">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="h-8 w-8 md:h-10 md:w-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-bold group-hover:text-accent transition-colors">Browse by Cards</h2>
                <p className="text-sm md:text-base text-muted-foreground">Filter documents by type like Aadhaar, PAN, or Voter ID.</p>
              </div>
              <div className="mt-auto pt-2 md:pt-4 flex items-center text-sm font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                View Card Types <ChevronRight className="ml-1 h-4 w-4" />
              </div>
            </motion.div>
          </Link>

          <motion.div variants={item}>
            <TransferAllDataCard />
          </motion.div>


          <CryptoWalletDrawer>
            <motion.div variants={item} className="md:col-span-2 h-full bg-card hover:bg-primary/5 border-2 border-primary/20 hover:border-primary/50 rounded-3xl p-6 md:p-12 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 cursor-pointer flex flex-col md:flex-row items-center text-center md:text-left gap-6 md:gap-8 group relative overflow-hidden">
              {/* Decorative background */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

              <div className="h-16 w-16 md:h-24 md:w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 shrink-0">
                <ShieldCheck className="h-8 w-8 md:h-12 md:w-12" />
              </div>

              <div className="space-y-2 flex-grow">
                <h2 className="text-xl md:text-2xl font-bold group-hover:text-primary transition-colors flex flex-col md:flex-row items-center gap-2 justify-center md:justify-start">
                  Crypto Seed Phrases
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 mt-1 md:mt-0">Secure</Badge>
                </h2>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                  Store your 12 or 24-word recovery phrases with military-grade encryption.
                  Never lose access to your digital assets.
                </p>
              </div>

              <div className="mt-auto pt-2 md:pt-0 flex items-center text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                Open Vault <ChevronRight className="ml-1 h-4 w-4" />
              </div>
            </motion.div>
          </CryptoWalletDrawer>
        </motion.div>
      </div>

      <div className="fixed bottom-2 text-[10px] text-muted-foreground text-center w-full p-2">
        © {new Date().getFullYear()} Government Document Management System
      </div>
      </div>

      {/* --- NEW MOBILE UI (Visible only on small screens) --- */}
      <div className="md:hidden flex flex-col min-h-screen bg-slate-950 text-slate-100 antialiased font-sans pb-24">
        {/* TopAppBar */}
        <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 transition-all duration-200">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-400 h-6 w-6" />
            <h1 className="font-bold tracking-[-0.02em] text-slate-100 text-lg uppercase">The Vault</h1>
          </div>
          <div className="flex items-center gap-2">
            <ProfileDialog />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-slate-200 active:scale-95 transition-transform duration-200 hover:opacity-80 p-2">
                  <LogOut className="h-5 w-5 text-red-400" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Log out of Vault?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will need to enter your credentials to access your documents again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => logout()} className="bg-destructive hover:bg-destructive/90">
                    Log Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8 flex-1">
          {/* Hero Status Section */}
          <section className="space-y-2">
            <p className="text-[10px] font-medium tracking-[0.05em] uppercase text-blue-400">Security Status: Encrypted</p>
            <h2 className="font-semibold text-3xl tracking-tight text-slate-100">Welcome back, Curator.</h2>
            <div className="w-12 h-1 bg-blue-400 rounded-full mt-4"></div>
          </section>

          {/* Bento Grid Main Actions */}
          <div className="grid grid-cols-2 gap-4">
            {/* Browse by People */}
            <Link href="/people" className="col-span-2 block">
              <div className="bg-slate-900 rounded-xl p-6 relative overflow-hidden group active:scale-[0.98] transition-all duration-200 border border-slate-800">
                <div className="relative z-10 space-y-4">
                  <Users className="text-blue-400 h-8 w-8" />
                  <div>
                    <h3 className="font-semibold text-xl text-slate-100">Browse by People</h3>
                    <p className="text-slate-400 text-sm mt-1">Manage documents for all family members.</p>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Users className="text-white h-32 w-32" />
                </div>
              </div>
            </Link>

            {/* Browse by Cards */}
            <Link href="/cards" className="block">
              <div className="bg-slate-800 rounded-xl p-6 relative flex flex-col justify-between aspect-square active:scale-[0.98] transition-all duration-200 border border-slate-700">
                <CreditCard className="text-cyan-400 h-8 w-8" />
                <div>
                  <h3 className="font-semibold text-lg text-slate-100 leading-tight block">Browse Cards</h3>
                  <p className="text-slate-400 text-[10px] mt-2 sm:text-xs">ID, Passports, DL</p>
                </div>
              </div>
            </Link>

            {/* Quick Stats */}
            <div className="bg-slate-900 rounded-xl p-6 relative flex flex-col justify-between aspect-square border border-slate-800">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Shield className="text-emerald-400 h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-2xl text-slate-200">{totalCards}</span>
                <p className="text-slate-400 text-[10px] mt-1 sm:text-xs">Documents Stored</p>
              </div>
            </div>

            {/* Crypto Recovery Phrases */}
            <div className="col-span-2">
              <CryptoWalletDrawer>
                <div className="bg-slate-800 w-full rounded-xl p-6 relative overflow-hidden border border-blue-500/20 active:scale-[0.98] transition-all duration-200 text-left">
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-xl text-emerald-400">Crypto Seed Phrases</h3>
                      <p className="text-slate-400 text-sm">Ultra-secure cold storage vault</p>
                    </div>
                    <div className="bg-emerald-900/30 p-3 rounded-full shrink-0">
                      <Lock className="text-emerald-400 h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <span className="px-3 py-1 bg-slate-950 text-[10px] font-medium uppercase tracking-wider text-emerald-400 rounded-full border border-slate-700">BIP-39 Standard</span>
                    <span className="px-3 py-1 bg-slate-950 text-[10px] font-medium uppercase tracking-wider text-emerald-400 rounded-full border border-slate-700">AES-256</span>
                  </div>
                </div>
              </CryptoWalletDrawer>
            </div>
            
            <div className="col-span-2 mt-2">
               <TransferAllDataCard />
            </div>
          </div>
        </main>

      </div>
    </>
  );
}
