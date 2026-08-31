import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface PortfolioProject {
  slug: string;
  title: string;
  category: string;
  description: string;
  image: string;
  results?: string;
  tech?: string[];
  client?: string;
  source: "hardcoded" | "db";
}

interface DbProject {
  slug: string;
  title: string;
  category: string;
  description: string;
  image: string;
  results?: string;
  tech?: string[];
  client?: string;
}

// Cache for projects to avoid repeated fetches
let projectsCache: PortfolioProject[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useDbProjects = () => {
  const [dbProjects, setDbProjects] = useState<PortfolioProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (force = false) => {
    // Check cache first
    const now = Date.now();
    if (!force && projectsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setDbProjects(projectsCache);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch only essential fields for faster loading
      // Wired to the superapp's portfolio_items table. Anon may read published
      // rows under RLS. The table ships empty — real client work is entered
      // through the CMS, and until then the section falls back to its own list.
      const { data: rows, error: supabaseError } = await supabase()
        .from("portfolio_items")
        .select("slug, title, category, summary, image_url, tags, client_name")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      const data: DbProject[] | null = rows
        ? rows.map((r) => ({
            slug: r.slug,
            title: r.title,
            category: r.category,
            description: r.summary,
            image: r.image_url ?? "",
            tech: Array.isArray(r.tags) ? (r.tags as string[]) : undefined,
            client: r.client_name || undefined,
          }))
        : null;

      if (supabaseError) {
        console.warn("Projects fetch error (fallback will show):", supabaseError.message);
        setError("Failed to load projects from database");
        projectsCache = [];
        setDbProjects([]);
        return;
      }

      if (data && data.length > 0) {
        const processedProjects = data.map((p: DbProject) => ({
          ...p,
          source: "db" as const,
        }));

        // Update cache
        projectsCache = processedProjects;
        cacheTimestamp = now;

        setDbProjects(processedProjects);
      } else {
        // No projects in DB, clear cache
        projectsCache = [];
        setDbProjects([]);
      }
    } catch (err) {
      console.warn("Unexpected error fetching projects (fallback will show):", err);
      setError("An unexpected error occurred");
      projectsCache = [];
      setDbProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch immediately on mount
    fetchProjects();
  }, [fetchProjects]);

  return { dbProjects, isLoading, error, refetch: () => fetchProjects(true) };
};
