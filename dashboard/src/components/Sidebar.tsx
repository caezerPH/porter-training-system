import React from "react";
import { useSettings } from "../context/SettingsContext";
import { useTheme } from "../context/ThemeContext";
import {
  BarChart3,
  Users,
  Megaphone,
  UserCog,
  Code,
  LogOut,
  GraduationCap,
  PhoneCall,
  Settings2,
  Sun,
  Moon,
  Minus,
  Plus,
  X,
} from "lucide-react";

export type Section =
  | "overview"
  | "leaderboard"
  | "announcements"
  | "branding"
  | "my-training";

interface SidebarProps {
  isAdmin: boolean;
  section: Section;
  onSection: (s: Section) => void;
  onOpenUsers: () => void;
  onOpenEmbed: () => void;
  onSignOut: () => void;
  userEmail?: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  key: Section;
  label: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isAdmin,
  section,
  onSection,
  onOpenUsers,
  onOpenEmbed,
  onSignOut,
  userEmail,
  mobileOpen,
  onCloseMobile,
}) => {
  const { resolved } = useSettings();
  const { theme, toggleTheme, incFont, decFont, fontScale, MIN, MAX } = useTheme();
  const nav: NavItem[] = isAdmin
    ? [
        { key: "overview", label: "Overview", icon: BarChart3 },
        { key: "leaderboard", label: "Agents", icon: Users },
        { key: "announcements", label: "Announcements", icon: Megaphone },
        { key: "branding", label: "Dashboard Settings", icon: Settings2 },
      ]
    : [{ key: "my-training", label: "My Training", icon: GraduationCap }];

  const select = (s: Section) => {
    onSection(s);
    onCloseMobile();
  };

  const navBtn = (item: NavItem) => {
    const Icon = item.icon;
    const active = section === item.key;
    return (
      <button
        key={item.key}
        onClick={() => select(item.key)}
        aria-current={active ? "page" : undefined}
        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
          active
            ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </button>
    );
  };

  const panel = (
    <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        {resolved.logoUrl ? (
          <img src={resolved.logoUrl} alt={resolved.clientName} className="h-9 w-9 rounded-xl object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-[11px] font-black uppercase text-white shadow-md shadow-brand-500/20">
            {resolved.clientShort.slice(0, 4)}
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">
            {resolved.clientName}
          </div>
          <div className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {resolved.clientTagline}
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-2">{nav.map(navBtn)}</nav>

      {/* Footer actions */}
      <div className="space-y-1 border-t border-slate-100 px-3 py-3 dark:border-slate-700">
        {!isAdmin && resolved.trainingAiUrl && (
          <a
            href={resolved.trainingAiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-1 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-500"
          >
            <PhoneCall className="h-4 w-4" /> Start Training Call
          </a>
        )}
        {isAdmin && (
          <>
            <button
              onClick={() => { onOpenUsers(); onCloseMobile(); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              <UserCog className="h-4 w-4 shrink-0" /> Manage Users
            </button>
            <button
              onClick={() => { onOpenEmbed(); onCloseMobile(); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              <Code className="h-4 w-4 shrink-0" /> Embed
            </button>
          </>
        )}
        {/* Appearance: theme + text size */}
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 dark:border-slate-700">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            title="Toggle light / dark"
          >
            {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            {theme === "dark" ? "Dark" : "Light"}
          </button>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={decFont}
              disabled={fontScale <= MIN}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label="Decrease text size"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-[10px] font-bold text-slate-400">A</span>
            <button
              onClick={incFont}
              disabled={fontScale >= MAX}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label="Increase text size"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="truncate px-3 pt-1 text-[10px] text-slate-400" title={userEmail}>
          {userEmail}
        </div>
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
        >
          <LogOut className="h-4 w-4 shrink-0" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Tablet / desktop: sticky full-height column */}
      <aside className="hidden md:block md:sticky md:top-0 md:h-screen md:shrink-0">{panel}</aside>

      {/* Phone: slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={onCloseMobile} />
          <div className="absolute left-0 top-0 h-full">{panel}</div>
        </div>
      )}
    </>
  );
};
