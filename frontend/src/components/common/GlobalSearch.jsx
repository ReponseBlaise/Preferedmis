import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Users,
  FolderKanban,
  Package,
  Calendar,
  Loader,
} from "lucide-react";
import api from "../../services/api";

const SECTIONS = [
  {
    key: "workers",
    label: "Workers",
    icon: Users,
    path: "/workers",
    color: "text-blue-600",
  },
  {
    key: "projects",
    label: "Projects",
    icon: FolderKanban,
    path: "/projects",
    color: "text-purple-600",
  },
  {
    key: "inventory",
    label: "Inventory",
    icon: Package,
    path: "/inventory",
    color: "text-green-600",
  },
  {
    key: "workers2",
    label: "Attendance",
    icon: Calendar,
    path: "/attendance",
    color: "text-orange-600",
  },
];

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({});
      setOpen(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query.trim()), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const runSearch = async (q) => {
    setLoading(true);
    setOpen(true);
    try {
      const [workers, projects, inventory] = await Promise.allSettled([
        api.getWorkers({ search: q }),
        api.getProjects({ search: q }),
        api.getInventoryItems({ search: q }),
      ]);

      const get = (res) => (res.status === "fulfilled" ? res.value || [] : []);

      setResults({
        workers: get(workers),
        projects: get(projects),
        inventory: get(inventory),
      });
    } catch {}
    setLoading(false);
  };

  const totalResults = Object.values(results).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  const handleSelect = (path, item, key) => {
    // Pass the search term as URL param so the target page can auto-filter
    const params = new URLSearchParams();
    if (key === "workers") params.set("search", item.full_name);
    if (key === "projects") params.set("search", item.name);
    if (key === "inventory") params.set("search", item.name);
    if (key === "messages") params.set("search", item.subject);
    navigate(`${path}?${params.toString()}`);
    setQuery("");
    setOpen(false);
  };

  const getLabel = (key, item) => {
    switch (key) {
      case "workers":
        return {
          primary: item.full_name,
          secondary: `${item.position || ""} · ${item.payment_type === "daily" ? `${item.rate_per_day} RWF/day` : "Monthly"}`,
        };
      case "projects":
        return {
          primary: item.name,
          secondary: `${item.status || ""} ${item.description ? "· " + item.description.slice(0, 50) : ""}`,
        };
      case "inventory":
        return {
          primary: item.name,
          secondary: `${item.category_name || ""} · Qty: ${item.quantity ?? 0} ${item.unit || ""}`,
        };
      default:
        return { primary: "", secondary: "" };
    }
  };

  // Map workers2 (attendance) to workers data
  const getSectionItems = (key) => {
    if (key === "workers2") return results["workers"] || [];
    return results[key] || [];
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search workers, projects, inventory… (Ctrl+K)"
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 placeholder-gray-400"
        />
        {query ? (
          <button
            onClick={() => {
              setQuery("");
              setResults({});
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        ) : (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-300 hidden sm:block">
            ⌘K
          </span>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[420px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-400 text-sm">
              <Loader size={15} className="animate-spin" /> Searching...
            </div>
          ) : query.length >= 2 && totalResults === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">
              No results for "
              <span className="font-medium text-gray-600">{query}</span>"
            </div>
          ) : (
            SECTIONS.map(({ key, label, icon: Icon, path, color }) => {
              const items = getSectionItems(key);
              // Don't show attendance section separately — workers already shown
              if (key === "workers2") return null;
              if (!items.length) return null;
              return (
                <div key={key}>
                  <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2 sticky top-0">
                    <Icon size={12} className={color} />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {label}
                    </span>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  </div>
                  {items.slice(0, 5).map((item, i) => {
                    const { primary, secondary } = getLabel(key, item);
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelect(path, item, key)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 group"
                      >
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-700">
                          {primary}
                        </p>
                        {secondary && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {secondary}
                          </p>
                        )}
                      </button>
                    );
                  })}
                  {items.length > 5 && (
                    <button
                      onClick={() => handleSelect(path, items[0], key)}
                      className="w-full text-xs text-blue-500 hover:text-blue-700 py-2 px-4 text-left hover:bg-blue-50 border-b border-gray-50"
                    >
                      View all {items.length} {label.toLowerCase()} →
                    </button>
                  )}
                </div>
              );
            })
          )}
          {!loading && totalResults > 0 && (
            <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100 text-right">
              {totalResults} result{totalResults !== 1 ? "s" : ""} found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
