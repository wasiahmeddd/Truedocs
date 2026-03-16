import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mailbox, Send, UserCheck, X } from "lucide-react";

type IncomingTransfer = {
  id: number;
  fromUserId: number;
  fromUsername: string;
  createdAt: string;
};

export function TransferAllDataCard() {
  const { toast } = useToast();
  const [toUsername, setToUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const incomingQuery = useQuery<IncomingTransfer[]>({
    queryKey: ["/api/transfers/incoming"],
    // default queryFn already uses credentials: include
  });

  const incoming = useMemo(() => incomingQuery.data || [], [incomingQuery.data]);

  const requestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/transfers/request", {
        toUsername,
        confirmPassword,
        moveWallets: true,
        moveCardTypes: true,
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Transfer request sent",
        description: `Request #${data?.request?.id ?? ""} created.`,
      });
      setToUsername("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["/api/transfers/outgoing"] });
    },
    onError: (e: Error) => {
      toast({
        title: "Failed to send request",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/transfers/${id}/accept`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transfer accepted",
        description: "Data ownership moved and files re-encrypted to your account.",
      });
      queryClient.invalidateQueries(); // ownership changes can affect many lists
    },
    onError: (e: Error) => {
      toast({
        title: "Accept failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/transfers/${id}/reject`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transfers/incoming"] });
    },
    onError: (e: Error) => {
      toast({
        title: "Reject failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="md:col-span-2 h-full bg-card hover:bg-accent/5 border border-border rounded-3xl p-6 md:p-10 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Send All Data</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1 max-w-2xl">
            Send your entire vault (people + cards + files) to another username. The receiver must accept.
          </p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Send className="h-6 w-6" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={requestMutation.isPending}>
              <Send className="h-4 w-4" />
              Create Transfer Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send All Data</DialogTitle>
              <DialogDescription>
                Enter the receiver username and confirm your password. This creates a request; the receiver must accept.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Receiver Username</Label>
                <Input value={toUsername} onChange={(e) => setToUsername(e.target.value)} placeholder="e.g. ali" />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm Your Password</Label>
                <Input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="Your current password"
                />
              </div>

              <Button
                className="w-full gap-2"
                onClick={() => requestMutation.mutate()}
                disabled={!toUsername || !confirmPassword || requestMutation.isPending}
              >
                <Send className="h-4 w-4" />
                Send Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Mailbox className="h-4 w-4" />
              Incoming Requests {incoming.length ? `(${incoming.length})` : ""}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Incoming Transfer Requests</DialogTitle>
              <DialogDescription>
                Accepting will move data into your account and re-encrypt files to your password-derived key.
              </DialogDescription>
            </DialogHeader>

            {incomingQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : incoming.length === 0 ? (
              <div className="text-sm text-muted-foreground">No pending requests.</div>
            ) : (
              <div className="space-y-3">
                {incoming.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 border rounded-xl p-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        From: <span className="text-primary">{r.fromUsername}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Request #{r.id}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => acceptMutation.mutate(r.id)}
                        disabled={acceptMutation.isPending}
                      >
                        <UserCheck className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => rejectMutation.mutate(r.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

