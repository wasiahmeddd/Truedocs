import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { GlobalAddCardDialog } from "@/components/GlobalAddCardDialog";
import { getIcon } from "@/lib/icon-map";
import { AddCardTypeDialog } from "@/components/AddCardTypeDialog";
import { useToast } from "@/hooks/use-toast";

type CardType = {
  id: number;
  slug: string;
  label: string;
  description: string;
  icon: string;
  color: string;
};

export default function CardsList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cardTypes, isLoading } = useQuery<CardType[]>({
    queryKey: ['cardTypes'],
    queryFn: async () => {
      const res = await fetch('/api/card-types');
      if (!res.ok) throw new Error('Failed to fetch types');
      return res.json();
    }
  });
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
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  if (isLoading) return <div className="p-8">Loading types...</div>;

  return (
    <>
    {/* DESKTOP UI */}
    <div className="hidden md:block min-h-screen bg-background p-4 md:p-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4 mb-8 md:mb-12">
        <div className="flex items-center gap-4">
          <Link href="/home">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Card Types</h1>
            <p className="text-sm md:text-base text-muted-foreground">Select a document type</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <AddCardTypeDialog />
          <GlobalAddCardDialog />
        </div>
      </header>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
      >
        {cardTypes?.map((type) => {
          const Icon = getIcon(type.icon);

          return (
            <Link key={type.slug} href={`/cards/${type.slug}`} className="block h-full group relative">
              <motion.div variants={item} className="h-full">
                <Card className={`h-full border-2 transition-all duration-300 hover:shadow-lg ${type.color || 'bg-card'} hover:-translate-y-1`}>
                  <CardContent className="p-8 flex items-center justify-between h-full relative">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-8 w-8 opacity-80" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold tracking-tight">{type.label}</h3>
                        <p className="opacity-70 font-medium">{type.description || "View all records"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <ChevronRight className="h-6 w-6 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>

    </div>

    {/* MOBILE UI */}
    <div className="md:hidden flex flex-col min-h-screen bg-slate-950 text-slate-100 antialiased font-sans pb-24">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 transition-all duration-200">
        <div className="flex items-center gap-3">
          <Link href="/home">
            <button className="text-slate-200 active:scale-95 transition-transform duration-200 hover:opacity-80 p-2 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <h1 className="font-bold tracking-[-0.02em] text-slate-100 text-base uppercase">Document Types</h1>
        </div>
        <div className="flex items-center gap-2">
           <AddCardTypeDialog />
           <GlobalAddCardDialog />
        </div>
      </header>

      <main className="pt-24 px-4 space-y-4 flex-1">
        <p className="text-[10px] font-medium tracking-[0.05em] uppercase text-cyan-400 px-1">Select a Category</p>
        
        <div className="flex flex-col gap-3">
          {cardTypes?.map((type) => {
            const Icon = getIcon(type.icon);
            return (
              <Link key={type.slug} href={`/cards/${type.slug}`} className="block">
                <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between border border-slate-800 active:scale-[0.98] transition-all duration-200 group relative overflow-hidden">
                  <div className="relative z-10 flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${type.color || 'bg-slate-800 text-slate-200'} shadow-sm`}>
                      <Icon className="h-6 w-6 opacity-90 text-slate-900" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-slate-100">{type.label}</h3>
                      <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{type.description || "View all records"}</p>
                    </div>
                  </div>
                  <ChevronRight className="relative z-10 text-slate-500 h-5 w-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  
                  {/* Subtle Background Icon */}
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03]">
                    <Icon className="h-24 w-24 text-white" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
    </>
  );
}
