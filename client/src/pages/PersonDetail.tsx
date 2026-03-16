import { useState } from "react";
import { useRoute, Link } from "wouter";
import { usePerson, usePeople } from "@/hooks/use-people";
import { shareContent } from "@/lib/share-util";
import { useToast } from "@/hooks/use-toast";
import { AddCardDialog } from "@/components/AddCardDialog";
import { CardItem } from "@/components/CardItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, FolderOpen, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { EditPersonDialog } from "@/components/EditPersonDialog";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 50 : -50,
    opacity: 0
  })
};

// Persist direction across remounts (fixes animation reset on navigation)
let lastDirection = 0;

export default function PersonDetail() {
  const [, params] = useRoute("/people/:id");
  const id = params ? parseInt(params.id) : 0;

  // Optimization: use cached person from list if available to avoid skeleton lag
  const { data: allPeople } = usePeople();
  const { data: personFromFetch, isLoading, error } = usePerson(id);

  const cachedPerson = allPeople?.find(p => p.id === id);
  const person = personFromFetch || cachedPerson;
  const [direction, setDirection] = useState(lastDirection);
  const { toast } = useToast();

  const handleDisplayDirection = (dir: number) => {
    lastDirection = dir;
    setDirection(dir);
  };

  const handleShareAll = async () => {
    if (!person) return;
    const result = await shareContent(
      `/api/people/${person.id}/export`,
      `${person.name}_cards.zip`,
      "Export Cards",
      "Sharing all cards"
    );
    if (result.status === "copied") {
      toast({ title: "Link copied", description: "Share link copied to clipboard." });
    } else if (result.status === "unsupported") {
      toast({
        title: "Sharing not available",
        description: "Native sharing on mobile requires HTTPS. Open the app over https:// and try again.",
        variant: "destructive",
      });
    } else if (result.status === "error") {
      toast({
        title: "Share failed",
        description: "Unable to open the share sheet. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate Prev/Next
  const sortedPeople = allPeople?.sort((a, b) => a.id - b.id) || [];
  const currentIndex = sortedPeople.findIndex(p => p.id === id);
  const prevPerson = currentIndex > 0 ? sortedPeople[currentIndex - 1] : null;
  const nextPerson = currentIndex < sortedPeople.length - 1 ? sortedPeople[currentIndex + 1] : null;

  // Only show skeleton if we have NO data at all
  if (isLoading && !person) return <DetailSkeleton />;

  if (error || (!person && !isLoading)) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <h2 className="text-2xl font-bold">Person Not Found</h2>
      <Link href="/people"><Button>Go Back</Button></Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Navigation Arrows (Fixed to Sides) */}
      <Link href={prevPerson ? `/people/${prevPerson.id}` : "#"}>
        <Button
          variant="outline"
          size="icon"
          disabled={!prevPerson}
          onClick={() => handleDisplayDirection(-1)}
          className={`fixed top-1/2 left-4 md:left-8 -translate-y-1/2 z-50 h-12 w-12 rounded-full shadow-lg border-primary/20 bg-background/80 backdrop-blur-sm transition-all hover:scale-110 hover:border-primary ${!prevPerson ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          title={prevPerson ? `Previous: ${prevPerson.name}` : ""}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </Link>

      <Link href={nextPerson ? `/people/${nextPerson.id}` : "#"}>
        <Button
          variant="outline"
          size="icon"
          disabled={!nextPerson}
          onClick={() => handleDisplayDirection(1)}
          className={`fixed top-1/2 right-4 md:right-8 -translate-y-1/2 z-50 h-12 w-12 rounded-full shadow-lg border-primary/20 bg-background/80 backdrop-blur-sm transition-all hover:scale-110 hover:border-primary ${!nextPerson ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          title={nextPerson ? `Next: ${nextPerson.name}` : ""}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </Link>

      <div className="max-w-5xl mx-auto">
        <Link href="/people" className="inline-block mb-6">
          <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="h-4 w-4" /> Back to People
          </Button>
        </Link>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={person.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
          >
            <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-sm mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-primary-foreground text-4xl font-bold shadow-lg">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-col md:flex-row items-center gap-2">
                      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{person.name}</h1>
                      <EditPersonDialog person={person} />
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full w-fit mx-auto md:mx-0">
                      <User className="h-3 w-3" />
                      <span className="text-xs font-medium">ID: #{person.id.toString().padStart(4, '0')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-start gap-4 bg-background p-4 rounded-xl border border-border shadow-sm w-full md:w-auto">
                  <div className="text-center px-4 border-r border-border flex-1 md:flex-none">
                    <div className="text-2xl font-bold text-primary">{person.cards.length}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Cards</div>
                  </div>
                  <div className="pl-2 flex gap-2">
                    <AddCardDialog personId={person.id} />
                    <Button variant="outline" size="icon" onClick={handleShareAll} title="Export/Share All Cards">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Documents & Cards
              </h2>

              {person.cards.length === 0 ? (
                <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/20">
                  <p className="text-muted-foreground mb-4">No cards found for this person.</p>
                  <AddCardDialog personId={person.id} />
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {person.cards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <CardItem card={card} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-background p-8 max-w-5xl mx-auto space-y-8">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
