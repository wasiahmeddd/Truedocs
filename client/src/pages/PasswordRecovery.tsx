import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PasswordRecovery() {
  const [username, setUsername] = useState("wasiahemadchoudhary");
  const [passwords, setPasswords] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; match?: string; message?: string } | null>(null);

  const handleCheck = async () => {
    const list = passwords.split("\n").map(p => p.trim()).filter(p => p.length > 0);
    if (!list.length) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/auth/bulk-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, passwords: list })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ success: false, message: "Error contacting server." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-xl text-white">
        <h1 className="text-2xl font-bold mb-4">Password Recovery Tool</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-slate-400">Username</label>
            <Input 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="bg-slate-800 border-slate-700 text-white" 
            />
          </div>
          
          <div>
            <label className="block text-sm mb-1 text-slate-400">Possible Passwords (one per line)</label>
            <Textarea 
              rows={8}
              value={passwords} 
              onChange={e => setPasswords(e.target.value)} 
              className="bg-slate-800 border-slate-700 font-mono text-white" 
              placeholder="pwd1&#10;pwd2&#10;..."
            />
          </div>
          
          <Button onClick={handleCheck} disabled={loading} className="w-full">
            {loading ? "Checking..." : "Check Passwords"}
          </Button>

          {result && (
            <div className={`p-4 rounded-md mt-4 ${result.success ? "bg-green-900/50 text-green-200 border border-green-800" : "bg-red-900/50 text-red-200 border border-red-800"}`}>
              {result.success ? (
                <div>
                  <p className="font-bold">Match Found!</p>
                  <p className="mt-1 font-mono text-lg">{result.match}</p>
                </div>
              ) : (
                <p>{result.message || "No match found."}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
