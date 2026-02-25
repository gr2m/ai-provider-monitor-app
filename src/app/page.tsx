import { readFileSync, statSync } from "fs";
import { join } from "path";
import { ChangesTable } from "./changes-table";

export type Change = {
  provider: string;
  route: string;
  method: string;
  change: "added" | "changed" | "removed";
  target: "route" | "request" | "response";
  breaking: boolean;
  deprecated: boolean;
  doc_only: boolean;
  note: string;
  date: string;
};

function loadChanges(): { changes: Change[]; lastUpdated: string } {
  const filePath = join(process.cwd(), "data", "changes.json");
  const raw = readFileSync(filePath, "utf-8");
  const changes: Change[] = JSON.parse(raw);
  const mtime = statSync(filePath).mtime;
  return { changes, lastUpdated: mtime.toISOString() };
}

export default function Home() {
  const { changes, lastUpdated } = loadChanges();
  const providers = [...new Set(changes.map((c) => c.provider))].sort();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Provider Monitor</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {changes.length} API changes tracked across {providers.length}{" "}
            providers
            <span className="mx-1.5">·</span>
            <span>
              Last updated{" "}
              <time dateTime={lastUpdated}>
                {new Date(lastUpdated).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </span>
          </p>
        </div>
        <a
          href="https://github.com/gr2m/ai-provider-monitor-app"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub
        </a>
      </header>
      <ChangesTable changes={changes} providers={providers} />
    </div>
  );
}
