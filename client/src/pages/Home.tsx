import { Link } from "wouter";
import { Users, CreditCard, ChevronRight, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { ProfileDialog } from "@/components/ProfileDialog";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CryptoWalletDrawer } from "@/components/CryptoWalletDrawer";
import { ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
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

      <div className="fixed bottom-2 md:bottom-6 text-[10px] md:text-xs text-muted-foreground text-center w-full p-2">
        © {new Date().getFullYear()} Government Document Management System
      </div>
    </div>
  );
}
