import { Link } from "wouter";
import { usePeople, useDeletePerson } from "@/hooks/use-people";
import { CreatePersonDialog } from "@/components/CreatePersonDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, CreditCard, ChevronRight, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
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

export default function PeopleList() {
  const { data: people, isLoading, error } = usePeople();
  const deletePerson = useDeletePerson();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) return <PeopleSkeleton />;
  if (error) return <div className="p-8 text-center text-destructive">Failed to load people. Please try again.</div>;

  return (
    <>
    {/* DESKTOP UI */}
    <div className="hidden md:block min-h-screen bg-background p-4 md:p-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-8 md:mb-12">
        <div className="flex items-center gap-4">
          <Link href="/home">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">People</h1>
            <p className="text-muted-foreground">Manage individuals and their documents</p>
          </div>
        </div>
        <CreatePersonDialog />
      </header>

      {people && people.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-muted-foreground/20">
          <div className="bg-background rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-sm">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No people added yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">Start by adding a family member or individual to manage their documents.</p>
          <CreatePersonDialog />
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {people?.map((person) => (
            <motion.div key={person.id} variants={item}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 border border-border/60 hover:border-primary/50 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete <strong>{person.name}</strong> and remove all their associated cards.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePerson.mutate(person.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Link href={`/people/${person.id}`} className="block h-full">
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xl shadow-md">
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{person.name}</h3>
                        <p className="text-sm text-muted-foreground">ID: #{person.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                        <CreditCard className="h-4 w-4" />
                        <span className="font-medium text-foreground">{person.cards.length}</span>
                        <span>Cards stored</span>
                      </div>
                    </div>

                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <ChevronRight className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
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
          <h1 className="font-bold tracking-[-0.02em] text-slate-100 text-base uppercase">People</h1>
        </div>
        <div className="flex items-center gap-2">
           <CreatePersonDialog />
        </div>
      </header>

      <main className="pt-24 px-4 space-y-4 flex-1">
        <p className="text-[10px] font-medium tracking-[0.05em] uppercase text-cyan-400 px-1">Manage Family & Individuals</p>
        
        {people && people.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 mt-8">
            <User className="h-12 w-12 mx-auto text-slate-500 mb-4" />
            <h3 className="text-lg font-medium text-slate-300">No people added yet</h3>
            <p className="text-slate-400 text-xs mt-2 max-w-[240px] mx-auto text-center">Start by adding a family member or individual to manage securely.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {people?.map((person) => (
              <div key={person.id} className="bg-slate-900 rounded-xl relative overflow-hidden border border-slate-800 transition-all duration-200 group flex items-stretch">
                <Link href={`/people/${person.id}`} className="flex-1 p-4 flex items-center justify-between active:bg-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                      <span className="text-blue-400 font-bold text-lg">{person.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-base text-slate-100">{person.name}</h3>
                      <p className="text-slate-400 text-xs mt-0.5">{person.cards.length} Records</p>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-500 h-5 w-5 opacity-50" />
                </Link>
                
                <div className="w-14 shrink-0 border-l border-slate-800 flex items-center justify-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="h-full w-full text-slate-400 hover:text-red-400 active:bg-red-500/10 transition-colors flex items-center justify-center">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-slate-100">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                          This action cannot be undone. This will permanently delete <strong>{person.name}</strong> and remove all their associated cards.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePerson.mutate(person.id)}
                          className="bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-600/30"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
    </>
  );
}

function PeopleSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
