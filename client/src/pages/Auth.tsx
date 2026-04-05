
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, User, KeyRound, Loader2, ArrowRight, AlertTriangle, FileDown, Eye, EyeOff, Wallet } from "lucide-react";
// ... (keep existing lines)


import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { generateEmergencyKit } from "@/utils/generateEmergencyKit";

export default function AuthPage() {
    const { loginMutation, user } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("login");
    const [showWarning, setShowWarning] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Default password visibility based on tab
    useEffect(() => {
        if (activeTab === "register") {
            setShowPassword(true);
            setShowConfirmPassword(true);
        } else {
            setShowPassword(false);
            setShowConfirmPassword(false);
        }
    }, [activeTab]);

    // Redirect if already logged in AND not showing warning
    useEffect(() => {
        if (user && !showWarning) {
            if (user.isAdmin) {
                setLocation("/admin");
            } else {
                setLocation("/home");
            }
        }
    }, [user, setLocation, showWarning]);


    // Registration Mutation
    const registerMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await apiRequest("POST", "/api/register", data);
            return await res.json();
        },
        onSuccess: (userData) => {
            toast({
                title: "Welcome aboard!",
                description: "Your secure vault has been created.",
            });
            // Update cache immediately to log user in on frontend
            queryClient.setQueryData(["/api/user"], userData.user || userData);

            // SHOW WARNING instead of redirecting
            setShowWarning(true);
        },
        onError: (error: Error) => {
            toast({
                title: "Registration failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData);
        try {
            const res: any = await loginMutation.mutateAsync(data as any);
            if (res.user?.isAdmin) {
                setLocation("/admin");
            } else {
                setLocation("/home");
            }
        } catch (err: any) {
            // Check for specific "User not found" error to auto-switch
            if (err.message && err.message.includes("User not found")) {
                setActiveTab("register");
            }
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData);

        if (data.password !== data.confirmPassword) {
            toast({
                title: "Passwords do not match",
                variant: "destructive"
            });
            return;
        }

        registerMutation.mutate({ username: data.username, password: data.password });
    };

    const handleDownloadKit = () => {
        if (user) {
            // Salt might not be in the user object yet depending on how backend returns it
            // But we can try.
            generateEmergencyKit(user.username, (user as any).salt || "HIDDEN_SALT");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            {/* Warning Modal (Serious Signup) */}
            <AnimatePresence>
                {showWarning && user && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4 backdrop-blur-md"
                    >
                        <div className="max-w-xl w-full bg-slate-900 border border-red-900/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-red-600 animate-pulse" />

                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mb-6 text-red-500">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>

                                <h2 className="text-3xl font-bold text-white mb-2">Wait! Read This.</h2>
                                <p className="text-slate-400 mb-8 max-w-md">
                                    We have just generated your unique encryption key.
                                    <strong className="text-red-400 block mt-2">We cannot recover your password if you forget it.</strong>
                                    Your data will be lost forever.
                                </p>

                                <Button
                                    onClick={handleDownloadKit}
                                    className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 mb-4 gap-2"
                                >
                                    <FileDown className="w-5 h-5" />
                                    Download Emergency Kit
                                </Button>

                                <p className="text-xs text-slate-500 mb-6">
                                    Contains your Username, Salt, and a space to write your Password.
                                </p>

                                <Button
                                    variant="ghost"
                                    onClick={() => setLocation("/home")}
                                    className="text-slate-400 hover:text-white"
                                >
                                    I understand, take me to my vault
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md z-10 p-4"
            >
                <Card className="border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="text-center">
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mx-auto bg-gradient-to-tr from-blue-500 to-cyan-500 p-3 rounded-2xl w-fit mb-4 shadow-lg shadow-blue-500/20"
                        >
                            <Lock className="w-8 h-8 text-white" />
                        </motion.div>
                        <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            Govt Cards
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-base">
                            Secure Encrypted Vault
                        </CardDescription>

                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-4 flex items-center justify-center gap-2 text-sm text-yellow-500/90 font-medium bg-yellow-500/5 py-1.5 px-3 rounded-full border border-yellow-500/10 mx-auto w-fit"
                        >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Secure Cryptocurrency Seed Phrases</span>
                        </motion.div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="grid w-full grid-cols-2 bg-white/5 border border-white/10 mb-6 p-1 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("login")}
                                    className={`relative z-10 py-1.5 text-sm font-medium transition-colors ${activeTab === "login" ? "text-white" : "text-slate-400 hover:text-white"}`}
                                >
                                    {activeTab === "login" && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="absolute inset-0 bg-blue-500/20 rounded-md -z-10"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    Login
                                </button>
                                <button
                                    onClick={() => setActiveTab("register")}
                                    className={`relative z-10 py-1.5 text-sm font-medium transition-colors ${activeTab === "register" ? "text-white" : "text-slate-400 hover:text-white"}`}
                                >
                                    {activeTab === "register" && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="absolute inset-0 bg-cyan-500/20 rounded-md -z-10"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    Sign Up
                                </button>
                            </div>

                            <form onSubmit={(e) => {
                                if (activeTab === "login") handleLogin(e);
                                else handleRegister(e);
                            }} className="flex flex-col">
                                <div className="space-y-4 mb-4">
                                    <motion.div layout className="space-y-2">
                                        <Label className="flex items-center overflow-hidden h-5">
                                            <AnimatePresence mode="popLayout" initial={false}>
                                                {activeTab === "register" && (
                                                    <motion.span
                                                        layout
                                                        className="font-medium mr-1 text-primary overflow-hidden whitespace-nowrap"
                                                        initial={{ width: 0, opacity: 0, x: -20 }}
                                                        animate={{ width: "auto", opacity: 1, x: 0 }}
                                                        exit={{ width: 0, opacity: 0, x: -20 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
                                                    >
                                                        Choose
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                            <motion.span
                                                layout
                                                className="font-medium"
                                                transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
                                            >
                                                Username
                                            </motion.span>
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                            <Input
                                                name="username"
                                                placeholder={activeTab === "login" ? "Enter your username" : "johndoe"}
                                                className="pl-10 bg-white/5 border-white/10 focus:border-purple-500 transition-colors"
                                                required
                                            />
                                        </div>
                                    </motion.div>

                                    <motion.div layout className="space-y-2">
                                        <Label className="flex items-center overflow-hidden h-5">
                                            <AnimatePresence mode="popLayout" initial={false}>
                                                {activeTab === "register" && (
                                                    <motion.span
                                                        layout
                                                        className="font-medium mr-1 text-primary overflow-hidden whitespace-nowrap"
                                                        initial={{ width: 0, opacity: 0, x: -20 }}
                                                        animate={{ width: "auto", opacity: 1, x: 0 }}
                                                        exit={{ width: 0, opacity: 0, x: -20 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
                                                    >
                                                        Create
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                            <motion.span
                                                layout
                                                className="font-medium"
                                                transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
                                            >
                                                Password
                                            </motion.span>
                                        </Label>
                                        <div className="relative">
                                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                            <Input
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder={activeTab === "login" ? "••••••••" : "Create a strong password"}
                                                className="pl-10 pr-10 bg-white/5 border-white/10 focus:border-cyan-500 transition-colors"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>

                                <AnimatePresence>
                                    {activeTab === "register" && (
                                        <motion.div
                                            key="confirm-password"
                                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                            className="space-y-2 overflow-hidden"
                                        >
                                            <p className="text-xs text-slate-500">
                                                This password will encrypt your files. Do not forget it.
                                            </p>
                                            <Label>Confirm Password</Label>
                                            <div className="relative">
                                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                                <Input
                                                    name="confirmPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Repeat password"
                                                    className="pl-10 pr-10 bg-white/5 border-white/10 focus:border-purple-500 transition-colors"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <motion.div
                                    layout
                                    key="submit-button"
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                >
                                    <Button
                                        type="submit"
                                        className={`w-full h-11 text-white shadow-lg transition-all duration-300 ${activeTab === "login"
                                            ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-cyan-900/20"
                                            : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-900/20"
                                            }`}
                                        disabled={loginMutation.isPending || registerMutation.isPending}
                                    >
                                        {activeTab === "login" ? (
                                            loginMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <span className="flex items-center justify-center">Unlock Vault <ArrowRight className="ml-2 h-4 w-4" /></span>
                                        ) : (
                                            registerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Secure Account"
                                        )}
                                    </Button>
                                </motion.div>
                            </form>
                        </Tabs>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
