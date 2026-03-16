import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scryptSync } from "crypto";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import MemoryStore from "memorystore";
import { encrypt, decrypt } from "./encryption";

declare global {
    namespace Express {
        interface User extends SelectUser { }
    }
}

declare module 'express-session' {
    interface SessionData {
        authenticated: boolean; // Keep for legacy compatibility if needed
        encryptionKey: string; // The derived key for file encryption
        privateKeyPem?: string; // Decrypted user private key (in-memory session only)
    }
}

export function setupAuth(app: Express) {
    const SessionStore = MemoryStore(session);
    const sessionSettings: session.SessionOptions = {
        secret: process.env.SESSION_SECRET || "govt_cards_super_secret_key",
        resave: false,
        saveUninitialized: false,
        store: new SessionStore({
            checkPeriod: 86400000 // prune expired entries every 24h
        }),
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            secure: process.env.NODE_ENV === "production",
        }
    };

    if (app.get("env") === "production") {
        app.set("trust proxy", 1); // trust first proxy
    }

    app.use(session(sessionSettings));
    app.use(passport.initialize());
    app.use(passport.session());

    // Track Last Active
    app.use(async (req, res, next) => {
        if (req.isAuthenticated() && req.user?.id) {
            // update asynchronously without blocking response
            storage.updateUser(req.user.id, { lastActive: new Date() }).catch(console.error);
        }
        next();
    });

    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const user = await storage.getUserByUsername(username);
                if (!user) {
                    return done(null, false, { message: "User not found" });
                }

                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    return done(null, false, { message: "Invalid password" });
                }

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }),
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id: number, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    // Hashing helper for encryption key
    // We use the USER'S salt and their PASSWORD to derive the key.
    // This key is never stored, only re-generated on login.
    function deriveEncryptionKey(password: string, salt: string) {
        // We can use scryptSync as in encryption.ts
        // In encryption.ts: getKey(password) -> scryptSync(password, SALT, 32)
        // Here we use the user-specific salt
        return crypto.scryptSync(password, salt, 32).toString('hex');
    }

    function deriveKeyEncryptionKey(password: string, keySalt: string) {
        // Separate derivation for encrypting the user's private key at rest
        return crypto.scryptSync(password, keySalt, 32).toString('hex');
    }

    function ensureUserKeypair(user: any, plainPassword: string) {
        if (user.keyPublic && user.keyPrivateEncrypted && user.keySalt) return user;

        // Generate RSA keypair for wrapping transfer keys
        const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
            modulusLength: 3072,
            publicKeyEncoding: { type: "spki", format: "pem" },
            privateKeyEncoding: { type: "pkcs8", format: "pem" },
        });

        const keySalt = crypto.randomBytes(16).toString("hex");
        const kek = deriveKeyEncryptionKey(plainPassword, keySalt);
        const privateEnc = encrypt(Buffer.from(privateKey, "utf8"), kek);

        return {
            ...user,
            keyPublic: publicKey,
            keyPrivateEncrypted: JSON.stringify(privateEnc),
            keySalt,
        };
    }

    function decryptUserPrivateKey(user: any, plainPassword: string): string {
        if (!user.keyPrivateEncrypted || !user.keySalt) {
            throw new Error("User key material missing");
        }
        const kek = deriveKeyEncryptionKey(plainPassword, user.keySalt);
        const encObj = JSON.parse(user.keyPrivateEncrypted);
        return decrypt(encObj, kek).toString("utf8");
    }

    app.post("/api/register", async (req, res, next) => {
        try {
            // Anti-bruteforce for registration (in-memory)
            const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.ip || "unknown";
            (globalThis as any).__registerAttempts ??= new Map<string, { count: number; resetAt: number }>();
            const reg: Map<string, { count: number; resetAt: number }> = (globalThis as any).__registerAttempts;
            const now = Date.now();
            const windowMs = 60 * 60 * 1000; // 1 hour
            const limit = 5;
            const st = reg.get(ip) || { count: 0, resetAt: now + windowMs };
            if (st.resetAt < now) {
                st.count = 0;
                st.resetAt = now + windowMs;
            }
            st.count += 1;
            reg.set(ip, st);
            if (st.count > limit) {
                const retryAfterSec = Math.ceil((st.resetAt - now) / 1000);
                return res.status(429).json({ message: `Too many registrations. Try again in ${retryAfterSec}s.` });
            }

            if (!req.body.username || !req.body.password) {
                return res.status(400).send("Username and password are required");
            }

            const existingUser = await storage.getUserByUsername(req.body.username);
            if (existingUser) {
                return res.status(400).send("Username already exists");
            }

            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const salt = crypto.randomBytes(16).toString('hex');

            // Create user with key material
            const baseUser = await storage.createUser({
                username: req.body.username,
                password: hashedPassword,
                salt: salt
            });

            const withKeys = ensureUserKeypair(baseUser as any, req.body.password);
            // Persist key material if it was newly created
            if (
                (baseUser as any).keyPublic !== withKeys.keyPublic ||
                (baseUser as any).keyPrivateEncrypted !== withKeys.keyPrivateEncrypted ||
                (baseUser as any).keySalt !== withKeys.keySalt
            ) {
                await storage.updateUser((baseUser as any).id, {
                    keyPublic: withKeys.keyPublic,
                    keyPrivateEncrypted: withKeys.keyPrivateEncrypted,
                    keySalt: withKeys.keySalt,
                } as any);
            }

            req.login(baseUser as any, (err) => {
                if (err) return next(err);

                // Set encryption key in session
                const key = deriveEncryptionKey(req.body.password, salt);
                req.session.encryptionKey = key;
                req.session.authenticated = true;
                try {
                    req.session.privateKeyPem = decryptUserPrivateKey(withKeys, req.body.password);
                } catch { }
                req.session.save((err) => {
                    if (err) return next(err);
                    res.json({ success: true, user: { id: (baseUser as any).id, username: (baseUser as any).username, isAdmin: (baseUser as any).isAdmin } });
                });
            });
        } catch (err) {
            next(err);
        }
    });

    app.post("/api/auth/login", (req, res, next) => {
        // Simple anti-bruteforce (in-memory). Strong enough for a single-node deployment.
        const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.ip || "unknown";
        const username = String(req.body?.username || "");
        const key = `${ip}::${username}`;
        const now = Date.now();
        (globalThis as any).__loginAttempts ??= new Map<string, { fails: number; lockUntil: number }>();
        const attempts: Map<string, { fails: number; lockUntil: number }> = (globalThis as any).__loginAttempts;
        const state = attempts.get(key) || { fails: 0, lockUntil: 0 };
        if (state.lockUntil > now) {
            const retryAfterSec = Math.ceil((state.lockUntil - now) / 1000);
            return res.status(429).json({ message: `Too many attempts. Try again in ${retryAfterSec}s.` });
        }

        passport.authenticate("local", (err: any, user: SelectUser, info: any) => {
            console.log("Auth attempt:", { err, user, info });
            if (err) return next(err);
            if (!user) {
                const nextFails = state.fails + 1;
                // Progressive lockout: after 5 fails, lock for 60s, after 8 for 5m, after 12 for 30m
                let lockForMs = 0;
                if (nextFails >= 12) lockForMs = 30 * 60 * 1000;
                else if (nextFails >= 8) lockForMs = 5 * 60 * 1000;
                else if (nextFails >= 5) lockForMs = 60 * 1000;
                attempts.set(key, { fails: nextFails, lockUntil: lockForMs ? now + lockForMs : 0 });
                return res.status(401).json({ message: info?.message || "Invalid credentials" });
            }

            if (user.isBanned) {
                return res.status(403).json({ message: "This account is banned. Contact wasiahemadchoudhary@gmail.com" });
            }

            req.login(user, (err) => {
                if (err) return next(err);

                // Derive and store encryption key in session
                const password = req.body.password;
                const key = deriveEncryptionKey(password, user.salt);

                req.session.encryptionKey = key;
                req.session.authenticated = true;
                try {
                    // Ensure keypair exists (backfill for older users) and load decrypted private key into session
                    const withKeys = ensureUserKeypair(user as any, password);
                    if (
                        (user as any).keyPublic !== withKeys.keyPublic ||
                        (user as any).keyPrivateEncrypted !== withKeys.keyPrivateEncrypted ||
                        (user as any).keySalt !== withKeys.keySalt
                    ) {
                        storage.updateUser((user as any).id, {
                            keyPublic: withKeys.keyPublic,
                            keyPrivateEncrypted: withKeys.keyPrivateEncrypted,
                            keySalt: withKeys.keySalt,
                        } as any).catch(console.error);
                    }
                    req.session.privateKeyPem = decryptUserPrivateKey(withKeys, password);
                } catch (e) {
                    console.error("Failed to load user private key:", e);
                }
                req.session.save((err) => {
                    if (err) return next(err);
                    attempts.delete(key); // successful login resets attempts
                    res.json({ success: true, user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
                });
            });
        })(req, res, next);
    });

    app.post("/api/auth/logout", (req, res, next) => {
        req.logout((err) => {
            if (err) return next(err);
            req.session.destroy((err) => {
                if (err) return next(err);
                res.json({ success: true });
            });
        });
    });

    app.get("/api/user", (req, res) => {
        if (req.isAuthenticated()) {
            res.json(req.user);
        } else {
            res.status(401).send("Not logged in");
        }
    });

    app.delete("/api/user", async (req, res, next) => {
        if (!req.isAuthenticated()) return res.sendStatus(401);

        try {
            const { password } = req.body;
            if (!password) return res.status(400).send("Password required");

            // Re-verify password
            const user = await storage.getUser(req.user.id);
            if (!user) return res.sendStatus(404);

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) return res.status(403).send("Incorrect password");

            // Proceed with deletion
            await storage.deleteUser(user.id);

            // Destroy session
            req.logout((err) => {
                if (err) return next(err);
                req.session.destroy((err) => {
                    if (err) return next(err);
                    res.json({ success: true });
                });
            });
        } catch (err) {
            next(err);
        }
    });
}

import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
        return res.status(403).send("Admin access required");
    }
    next();
}
