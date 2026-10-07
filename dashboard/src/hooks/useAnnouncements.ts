import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

// Reads announcements (RLS lets everyone read). Admin-only writes are gated by RLS
// at the database, so a non-admin calling create/remove simply fails server-side.
export function useAnnouncements(activeOnly: boolean) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (activeOnly) q = q.eq("is_active", true);
    const { data, error } = await q;
    if (error) setError(error.message);
    else setItems((data || []) as Announcement[]);
    setLoading(false);
  }, [activeOnly]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const create = async (title: string, body: string, createdBy?: string) => {
    const { error } = await supabase
      .from("announcements")
      .insert([{ title, body, created_by: createdBy ?? null }]);
    if (error) throw new Error(error.message);
    await fetchItems();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetchItems();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("announcements").update({ is_active: isActive }).eq("id", id);
    if (error) throw new Error(error.message);
    await fetchItems();
  };

  return { items, loading, error, refetch: fetchItems, create, remove, toggleActive };
}
