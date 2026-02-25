"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo, Suspense } from "react";
import type { Change } from "./page";

function ChangesTableInner({
  changes,
  providers,
}: {
  changes: Change[];
  providers: string[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Provider dropdown is just for scoping the route picker
  const currentProvider = searchParams.get("provider") || "";

  // Selected routes stored as "provider:METHOD /path"
  const selectedRoutes = useMemo(() => {
    const param = searchParams.get("routes");
    return param ? param.split(",").filter(Boolean) : [];
  }, [searchParams]);

  const changeFilter = searchParams.get("change") || "";
  const targetFilter = searchParams.get("target") || "";
  const breakingFilter = searchParams.get("breaking") || "";
  const docOnlyFilter = searchParams.get("doc_only") || "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Routes available for the currently selected provider
  const availableRoutes = useMemo(() => {
    if (!currentProvider) return [];
    const routeSet = new Set<string>();
    for (const c of changes) {
      if (c.provider === currentProvider) {
        routeSet.add(`${c.method} /${c.route}`);
      }
    }
    return [...routeSet].sort();
  }, [changes, currentProvider]);

  // Routes not yet selected for the current provider
  const unselectedRoutes = useMemo(
    () =>
      availableRoutes.filter(
        (r) => !selectedRoutes.includes(`${currentProvider}:${r}`)
      ),
    [availableRoutes, selectedRoutes, currentProvider]
  );

  const addRoute = useCallback(
    (route: string) => {
      if (!route || !currentProvider) return;
      const key = `${currentProvider}:${route}`;
      if (selectedRoutes.includes(key)) return;
      const newRoutes = [...selectedRoutes, key].sort();
      updateParam("routes", newRoutes.join(","));
    },
    [selectedRoutes, currentProvider, updateParam]
  );

  const removeRoute = useCallback(
    (routeKey: string) => {
      const newRoutes = selectedRoutes.filter((r) => r !== routeKey);
      updateParam("routes", newRoutes.join(","));
    },
    [selectedRoutes, updateParam]
  );

  const filtered = useMemo(() => {
    return changes.filter((c) => {
      // Route filter: match against selected provider:route pairs
      if (selectedRoutes.length > 0) {
        const key = `${c.provider}:${c.method} /${c.route}`;
        if (!selectedRoutes.includes(key)) return false;
      }
      if (changeFilter && c.change !== changeFilter) return false;
      if (targetFilter && c.target !== targetFilter) return false;
      if (breakingFilter === "true" && !c.breaking) return false;
      if (breakingFilter === "false" && c.breaking) return false;
      if (docOnlyFilter === "true" && !c.doc_only) return false;
      if (docOnlyFilter === "false" && c.doc_only) return false;
      return true;
    });
  }, [
    changes,
    selectedRoutes,
    changeFilter,
    targetFilter,
    breakingFilter,
    docOnlyFilter,
  ]);

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const hasFilters =
    selectedRoutes.length > 0 ||
    changeFilter ||
    targetFilter ||
    breakingFilter ||
    docOnlyFilter;

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3 items-end">
        {/* Provider dropdown */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Provider
          </label>
          <select
            value={currentProvider}
            onChange={(e) => updateParam("provider", e.target.value)}
            className="px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          >
            <option value="">Select provider...</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Route dropdown - only when a provider is selected */}
        {currentProvider && (
          <div className="min-w-48">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Route
            </label>
            <select
              value=""
              onChange={(e) => addRoute(e.target.value)}
              className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <option value="">
                {unselectedRoutes.length === 0
                  ? "All routes selected"
                  : "Add route..."}
              </option>
              {unselectedRoutes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Change type filter */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Change
          </label>
          <select
            value={changeFilter}
            onChange={(e) => updateParam("change", e.target.value)}
            className="px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          >
            <option value="">All</option>
            <option value="added">added</option>
            <option value="changed">changed</option>
            <option value="removed">removed</option>
          </select>
        </div>

        {/* Target filter */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Target
          </label>
          <select
            value={targetFilter}
            onChange={(e) => updateParam("target", e.target.value)}
            className="px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          >
            <option value="">All</option>
            <option value="route">route</option>
            <option value="request">request</option>
            <option value="response">response</option>
          </select>
        </div>

        {/* Breaking filter */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Breaking
          </label>
          <select
            value={breakingFilter}
            onChange={(e) => updateParam("breaking", e.target.value)}
            className="px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        {/* Doc-only filter */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Doc-only
          </label>
          <select
            value={docOnlyFilter}
            onChange={(e) => updateParam("doc_only", e.target.value)}
            className="px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Selected route chips */}
      {selectedRoutes.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {selectedRoutes.map((key) => {
            const colonIdx = key.indexOf(":");
            const provider = key.slice(0, colonIdx);
            const route = key.slice(colonIdx + 1);
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200 font-mono"
              >
                <span className="font-sans font-medium">{provider}</span>
                {route}
                <button
                  onClick={() => removeRoute(key)}
                  className="ml-0.5 hover:text-red-600 dark:hover:text-red-400"
                  aria-label={`Remove ${key}`}
                >
                  &times;
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
        Showing {filtered.length} of {changes.length} changes
      </p>

      {/* Table */}
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-700 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-left">
              <th className="px-3 py-2 font-medium whitespace-nowrap">Date</th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">
                Provider
              </th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">
                Route
              </th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">
                Change
              </th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">
                Target
              </th>
              <th className="px-3 py-2 font-medium">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((c, i) => (
              <tr
                key={i}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
              >
                <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">
                  {c.date}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{c.provider}</td>
                <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">
                  <span className="inline-block w-14 text-zinc-500">
                    {c.method}
                  </span>{" "}
                  /{c.route}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <ChangeBadge change={c.change} />
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="text-xs">{c.target}</span>
                  {c.breaking && (
                    <span className="ml-1 text-xs text-red-600 dark:text-red-400 font-medium">
                      breaking
                    </span>
                  )}
                  {c.doc_only && (
                    <span className="ml-1 text-xs text-zinc-400">
                      doc-only
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-zinc-600 dark:text-zinc-400 max-w-lg">
                  {c.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChangeBadge({ change }: { change: string }) {
  const styles: Record<string, string> = {
    added:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    changed:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    removed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span
      className={`inline-block px-1.5 py-0.5 text-xs rounded font-medium ${styles[change] || ""}`}
    >
      {change}
    </span>
  );
}

export function ChangesTable({
  changes,
  providers,
}: {
  changes: Change[];
  providers: string[];
}) {
  return (
    <Suspense>
      <ChangesTableInner changes={changes} providers={providers} />
    </Suspense>
  );
}
