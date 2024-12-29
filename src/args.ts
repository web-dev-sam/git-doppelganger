import { isAbsolute, resolve } from "node:path";
import process from "node:process";

interface PathArgs {
  from: string;
  to: string;
}

export async function processArgs(args: string[]): Promise<PathArgs | null> {
  const parsedArgs = parseArgs(args);
  if (!parsedArgs || !await validatePaths(parsedArgs)) {
    return null;
  }
  return parsedArgs;
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path); // Deno
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      return false;
    }

    try {
      await import("node:fs/promises").then((fs) => fs.stat(path)); // Node.js
      return true;
    } catch {
      return false;
    }
  }
}

async function validatePaths(args: PathArgs | null): Promise<boolean> {
  if (!args?.from || !args?.to) {
    console.error(`
Usage: your-command [options]
Options:
  --from, -f    Source directory path
  --to, -t      Destination directory path

Example: your-command --from ./source --to ./destination
    `);
    return false;
  }

  const fromPath = isAbsolute(args.from)
    ? args.from
    : resolve(process.cwd(), args.from);
  const toPath = isAbsolute(args.to)
    ? args.to
    : resolve(process.cwd(), args.to);

  if (!await exists(fromPath)) {
    console.error(`Error: Source directory "${fromPath}" does not exist`);
    return false;
  }

  if (!await exists(toPath)) {
    console.error(`Error: Destination directory "${toPath}" does not exist`);
    return false;
  }

  return true;
}

function parseArgs(args: string[]): PathArgs | null {
  const parsedArgs: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === "--from" || arg === "-f") {
      parsedArgs.from = nextArg;
      i++;
    } else if (arg === "--to" || arg === "-t") {
      parsedArgs.to = nextArg;
      i++;
    }
  }

  return {
    from: parsedArgs.from,
    to: parsedArgs.to,
  };
}
