// components/admin/SearchFilters.tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { useTransition } from "react";

export default function SearchFilters({
  currentSearch,
  currentCategory,
  currentDifficulty,
}: {
  currentSearch?: string;
  currentCategory?: string;
  currentDifficulty?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateSearchParams = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // Reset to page 1 on filter

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearch = useDebouncedCallback((term: string) => {
    updateSearchParams("q", term.trim() || undefined);
  }, 400);

  return (
    <div className="flex flex-wrap gap-4 items-center bg-gray-900/50 border border-gray-800 rounded-lg p-3">
      {/* Search Input */}
      <div className="flex-1 min-w-[200px]">
        <input
          type="text"
          defaultValue={currentSearch}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search questions..."
          className="w-full px-3 py-1.5 bg-[#111] border border-gray-700 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition"
        />
      </div>

      {/* Category Filter */}
      <div className="w-[180px]">
        <select
          defaultValue={currentCategory || ""}
          onChange={(e) =>
            updateSearchParams("category", e.target.value || undefined)
          }
          className="w-full px-3 py-1.5 bg-[#111] border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:border-green-500"
        >
          <option value="">All Categories</option>
          <option value="arrays">Arrays</option>
          <option value="strings">Strings</option>
          <option value="trees">Trees</option>
          <option value="graphs">Graphs</option>
          <option value="dp">Dynamic Programming</option>
          {/* Add more from your actual data */}
        </select>
      </div>

      {/* Difficulty Filter */}
      <div className="w-[150px]">
        <select
          defaultValue={currentDifficulty || ""}
          onChange={(e) =>
            updateSearchParams("difficulty", e.target.value || undefined)
          }
          className="w-full px-3 py-1.5 bg-[#111] border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:border-green-500"
        >
          <option value="">All Levels</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </div>

      {isPending && (
        <div className="text-xs text-green-400 animate-pulse">Updating...</div>
      )}
    </div>
  );
}
