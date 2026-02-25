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

  const selectedProviders = useMemo(() => {
    const param = searchParams.get("providers");
    return param ? param.split(",").filter(Boolean) : [];
  }, [searchParams]);

  const selectedRoutes = useMemo(() => {
    const param = searchParams.get("routes");
    return param ? param.split(",").filter(Boolean) : [];
  }, [searchParams]);

  const changeFilter = searchParams.get("change") || "";
  const targetFilter = searchParams.get("target") || "";
  const breakingFilter = searchParams.get("breaking") || "";
  const docOnlyFilter = searchParams.get("doc_only") || "";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const updateParam = useCallback(
    (key: string, value: string) => updateParams({ [key]: value }),
    [updateParams]
  );

  const toggleProvider = useCallback(
    (provider: string) => {
      const current = new Set(selectedProviders);
      if (current.has(provider)) {
        current.delete(provider);
      } else {
        current.add(provider);
      }
      const newProviders = [...current].sort().join(",");

      // Clear routes that no longer belong to any selected provider
      if (selectedRoutes.length > 0) {
        const providerRoutes = new Set<string>();
        for (const c of changes) {
          if (current.has(c.provider)) {
            providerRoutes.add(`${c.method} /${c.route}`);
          }
        }
        const validRoutes = selectedRoutes.filter((r) =>
          providerRoutes.has(r)
        );
        updateParams({
          providers: newProviders,
          routes: validRoutes.join(","),
        });
      } else {
        updateParam("providers", newProviders);
      }
    },
    [selectedProviders, selectedRoutes, changes, updateParams, updateParam]
  );

  const availableRoutes = useMemo(() => {
    if (selectedProviders.length === 0) return [];
    const routeSet = new Set<string>();
    for (const c of changes) {
      if (selectedProviders.includes(c.provider)) {
        routeSet.add(`${c.method} /${c.route}`);
      }
    }
    return [...routeSet].sort();
  }, [changes, selectedProviders]);

  const unselectedRoutes = useMemo(
    () => availableRoutes.filter((r) => !selectedRoutes.includes(r)),
    [availableRoutes, selectedRoutes]
  );

  const addRoute = useCallback(
    (route: string) => {
      if (!route || selectedRoutes.includes(route)) return;
      const newRoutes = [...selectedRoutes, route].sort();
      updateParam("routes", newRoutes.join(","));
    },
    [selectedRoutes, updateParam]
  );

  const removeRoute = useCallback(
    (route: string) => {
      const newRoutes = selectedRoutes.filter((r) => r !== route);
      updateParam("routes", newRoutes.join(","));
    },
    [selectedRoutes, updateParam]
  );

  const filtered = useMemo(() => {
    return changes.filter((c) => {
      if (
        selectedProviders.length > 0 &&
        !selectedProviders.includes(c.provider)
      )
        return false;
      if (
        selectedRoutes.length > 0 &&
        !selectedRoutes.includes(`${c.method} /${c.route}`)
      )
        return false;
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
    selectedProviders,
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
    selectedProviders.length > 0 ||
    selectedRoutes.length > 0 ||
    changeFilter ||
    targetFilter ||
    breakingFilter ||
    docOnlyFilter;

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3 items-end">
        {/* Provider filter */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Providers
          </label>
          <div className="flex flex-wrap gap-1">
            {providers.map((p) => (
              <button
                key={p}
                onClick={() => toggleProvider(p)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${
                  selectedProviders.includes(p)
                    ? "bg-zinc-800 text-white border-zinc-700 dark:bg-zinc-200 dark:text-black dark:border-zinc-300"
                    : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Route filter - only when providers are selected */}
        {selectedProviders.length > 0 && (
          <div className="min-w-48">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Routes
            </label>
            <select
              value=""
              onChange={(e) => {
                addRoute(e.target.value);
                e.target.value = "";
              }}
              className="w-full px-2 py-1 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            >
              <option value="">
                {selectedRoutes.length > 0
                  ? "Add another route..."
                  : "All routes"}
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
          {selectedRoutes.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200 font-mono"
            >
              {r}
              <button
                onClick={() => removeRoute(r)}
                className="ml-0.5 hover:text-red-600 dark:hover:text-red-400"
                aria-label={`Remove ${r}`}
              >
                &times;
              </button>
            </span>
          ))}
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
