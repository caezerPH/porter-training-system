import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAgentTrainingData } from "../hooks/useAgentTrainingData";
import { useIsEmbedded } from "../hooks/useEmbedMode";
import { OverviewKpiCards } from "../components/OverviewKpiCards";
import { AnalyticsTrendCharts } from "../components/AnalyticsTrendCharts";
import { AgentLeaderboard } from "../components/AgentLeaderboard";
import { AgentDetailModal } from "../components/AgentDetailModal";
import { EmbedCodeModal } from "../components/EmbedCodeModal";
import { ManageUsersModal } from "../components/ManageUsersModal";
import { MyTraining } from "../components/MyTraining";
import { AnnouncementsAdmin } from "../components/Announcements";
import { BrandingSettings } from "../components/BrandingSettings";
import { Sidebar, Section } from "../components/Sidebar";
import { useAuth } from "../components/AuthGate";
import { AgentMetric } from "../types/agentTraining";
import { Menu, RefreshCw, Clock, Eye, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const SYNC_KEY_ENABLED = "pref_autosync_enabled";
const AUTO_INTERVAL = 900_000; // 15 min background refresh

const SECTION_TITLES: Record<Section, string> = {
  overview: "Overview",
  leaderboard: "Agents",
  announcements: "Announcements",
  branding: "Dashboard Settings",
  "my-training": "My Training",
};

const DashboardContent: React.FC = () => {
  const { isAdmin, user } = useAuth();
  const isEmbedded = useIsEmbedded();

  const [section, setSection] = useState<Section>(isAdmin ? "overview" : "my-training");
  const [selectedAgent, setSelectedAgent] = useState<AgentMetric | null>(null);
  const [isEmbedOpen, setIsEmbedOpen] = useState(false);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(
    () => localStorage.getItem(SYNC_KEY_ENABLED) !== "false",
  );
  useEffect(() => {
    localStorage.setItem(SYNC_KEY_ENABLED, String(autoSyncEnabled));
  }, [autoSyncEnabled]);

  const {
    data: analytics,
    isLoading,
    error,
    usingSampleData,
    lastFetchedAt,
    refetch,
  } = useAgentTrainingData({
    enabled: isEmbedded ? true : autoSyncEnabled,
    intervalMs: AUTO_INTERVAL,
  });

  const lastFetchedLabel = lastFetchedAt
    ? lastFetchedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "—";

  // A non-admin user sees only their own agent (enforced by RLS).
  const myAgent = analytics.agents[0] ?? null;

  const emptyState = usingSampleData && !error && (
    <div className="rounded-xl bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400">
        <Users className="h-6 w-6" />
      </div>
      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">No training data yet</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        No agents have been synced yet. Run the server-side ingestion (sync-contacts.js) to populate data.
      </p>
    </div>
  );

  const errorBanner = error && (
    <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-900/50 p-4 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2 shadow-sm">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold">Could not load data: {error}</p>
        <p className="mt-0.5">Check your connection and try again.</p>
      </div>
    </div>
  );

  const renderSection = () => {
    if (section === "my-training") {
      return (
        <MyTraining agent={myAgent} onOpenReport={() => myAgent && setSelectedAgent(myAgent)} />
      );
    }
    if (section === "announcements") return <AnnouncementsAdmin />;
    if (section === "branding") return <BrandingSettings />;
    if (section === "leaderboard") {
      return (
        <AgentLeaderboard agents={analytics.agents} onSelectAgent={setSelectedAgent} />
      );
    }
    // overview
    return (
      <div className="space-y-6">
        <OverviewKpiCards analytics={analytics} />
        <AnalyticsTrendCharts analytics={analytics} />
        <AgentLeaderboard agents={analytics.agents} onSelectAgent={setSelectedAgent} />
      </div>
    );
  };

  // Embedded view-only: no sidebar/chrome, just the overview content.
  if (isEmbedded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <Eye className="h-3.5 w-3.5" /> View Only
          </div>
          {errorBanner}
          {emptyState}
          <OverviewKpiCards analytics={analytics} />
          <AnalyticsTrendCharts analytics={analytics} />
          <AgentLeaderboard agents={analytics.agents} onSelectAgent={setSelectedAgent} />
        </div>
        <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans antialiased">
      <Sidebar
        isAdmin={isAdmin}
        section={section}
        onSection={setSection}
        onOpenUsers={() => setIsUsersOpen(true)}
        onOpenEmbed={() => setIsEmbedOpen(true)}
        onSignOut={() => supabase.auth.signOut()}
        userEmail={user?.email}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Slim top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {SECTION_TITLES[section]}
            </h1>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1 text-[11px] text-slate-400 sm:flex">
                <Clock className="h-3 w-3" /> {lastFetchedLabel}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={isLoading}
                className="h-8 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span className="ml-1 hidden sm:inline">Sync</span>
              </Button>
            </div>
          )}
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            {errorBanner}
            {section !== "announcements" && section !== "branding" && emptyState}
            {renderSection()}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      <EmbedCodeModal isOpen={isEmbedOpen} onClose={() => setIsEmbedOpen(false)} />
      <ManageUsersModal
        isOpen={isUsersOpen}
        onClose={() => setIsUsersOpen(false)}
        agents={analytics.agents}
      />
    </div>
  );
};

const Index: React.FC = () => <DashboardContent />;

export default Index;
