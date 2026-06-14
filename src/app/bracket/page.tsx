"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { app as firebaseApp } from "@/lib/firebase";
import { getBracketMatches, getBracketConfig, getUserPick, getAllPicks } from "@/lib/firestore/bracket";
import type { BracketMatch, BracketConfig, BracketPick } from "@/lib/firestore/bracket";
import { useTranslation } from "@/lib/i18n";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import BracketTeaser from "@/components/bracket/BracketTeaser";
import BracketWizard from "@/components/bracket/BracketWizard";
import BracketReadOnly from "@/components/bracket/BracketReadOnly";
import BracketLeaderboard from "@/components/bracket/BracketLeaderboard";

type PageState = "loading" | "ready";

export default function BracketPage() {
  const t = useTranslation();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<BracketConfig | null>(null);
  const [matches, setMatches] = useState<BracketMatch[]>([]);
  const [pick, setPick] = useState<BracketPick | null>(null);
  const [pickLoading, setPickLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [allPicks, setAllPicks] = useState<BracketPick[]>([]);

  // Auth listener
  useEffect(() => {
    const auth = getAuth(firebaseApp);
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // Load config + matches on mount
  useEffect(() => {
    async function load() {
      const [cfg, mts] = await Promise.all([getBracketConfig(), getBracketMatches()]);
      setConfig(cfg);
      setMatches(mts);
      setPageState("ready");
    }
    load().catch(console.error);
  }, []);

  // Load user's own pick when user and config are known
  useEffect(() => {
    if (!config) return;
    if (config.status === "closed") { setPickLoading(false); return; }
    if (!user) { setPickLoading(false); return; }
    setPickLoading(true);
    getUserPick(user.uid)
      .then(setPick)
      .catch(console.error)
      .finally(() => setPickLoading(false));
    setUserName(user.displayName ?? user.email ?? "");
  }, [user, config]);

  // Load all picks for leaderboard when bracket is locked/finished
  useEffect(() => {
    const s = config?.status;
    if (s !== "locked" && s !== "finished") return;
    getAllPicks().then(setAllPicks).catch(console.error);
  }, [config]);

  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#060a10" }}>
        <div className="text-sm" style={{ color: "#8a7a50" }}>{t.profile.loading}</div>
      </div>
    );
  }

  const status = config?.status ?? "closed";

  // Unauthenticated users visiting an open bracket
  if (status === "open" && !user) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#060a10" }}>
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center pb-20">
          <p className="text-sm" style={{ color: "#c0aa78" }}>{t.bracket.loginRequired}</p>
          <button
            onClick={() => router.push("/auth/register")}
            className="px-6 py-3 rounded-2xl text-sm font-bold"
            style={{ background: "#f0c040", color: "#060a10" }}
          >
            {t.bracket.loginBtn}
          </button>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#060a10" }}>
      <Header />
      <main className="flex-1">
        {status === "closed" && (
          <BracketTeaser isLoggedIn={!!user} />
        )}

        {status === "open" && user && (
          pickLoading
            ? <div className="flex items-center justify-center py-20"><div className="text-sm" style={{ color: "#8a7a50" }}>{t.profile.loading}</div></div>
            : <BracketWizard
                matches={matches}
                initialPick={pick}
                userId={user.uid}
                userName={userName}
              />
        )}

        {(status === "locked" || status === "finished") && (
          <div className="flex flex-col gap-6 pb-28">
            <BracketReadOnly
              matches={matches}
              pick={pick}
              isFinished={status === "finished"}
            />
            <div
              className="mx-4 border-t"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            />
            <BracketLeaderboard
              matches={matches}
              allPicks={allPicks}
              currentUserId={user?.uid ?? null}
              isFinished={status === "finished"}
            />
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
