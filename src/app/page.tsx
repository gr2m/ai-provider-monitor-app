import { readFileSync } from "fs";
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

function loadChanges(): Change[] {
  const filePath = join(process.cwd(), "data", "changes.json");
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

export default function Home() {
  const changes = loadChanges();
  const providers = [...new Set(changes.map((c) => c.provider))].sort();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">AI Provider Monitor</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {changes.length} API changes tracked across {providers.length}{" "}
          providers
        </p>
      </header>
      <ChangesTable changes={changes} providers={providers} />
    </div>
  );
}
