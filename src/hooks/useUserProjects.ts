import { useState, useEffect, useCallback } from "react";

const PROJECTS_LOCAL_STORAGE_KEY = "changelog-user-projects";

export function useUserProjects() {
  const [projects, setProjects] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load projects from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROJECTS_LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setProjects(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load projects from localStorage:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(
          PROJECTS_LOCAL_STORAGE_KEY,
          JSON.stringify(projects),
        );
      } catch (e) {
        console.error("Failed to save projects to localStorage:", e);
      }
    }
  }, [projects, isLoaded]);

  const addProject = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    setProjects((prev) => {
      // Check if project already exists (case-insensitive)
      const exists = prev.some(
        (p) => p.toLowerCase() === trimmed.toLowerCase(),
      );
      if (exists) return prev;

      return [...prev, trimmed];
    });

    return true;
  }, []);

  const removeProject = useCallback((name: string) => {
    setProjects((prev) => prev.filter((p) => p !== name));
  }, []);

  const hasProject = useCallback(
    (name: string) => {
      return projects.some((p) => p.toLowerCase() === name.toLowerCase());
    },
    [projects],
  );

  return {
    projects,
    addProject,
    removeProject,
    hasProject,
    isLoaded,
  };
}
