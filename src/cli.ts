import { initCli } from "./init.ts";
import { getRandomLine, maskPath } from "./utils.ts";
import process from "node:process";
import { mkdir, unlink, writeFile, readFile } from "node:fs/promises";
import { dirname } from "node:path";

const { fromRepo, emails, toRepo, toRepoBase } = await initCli();
const { all: fromRepoCommits } = await fromRepo.log();
if (fromRepoCommits.length < 2) {
  console.error("Not enough commits to compare");
  process.exit(1);
}

for (let i = fromRepoCommits.length - 1; i > 0; i--) {
  const isFirst = i === fromRepoCommits.length - 1;
  const EMPTY_TREE = { hash: "4b825dc642cb6eb9a060e54bf8d69288fbee4904" };
  const olderCommit = isFirst ? EMPTY_TREE : fromRepoCommits[i];
  const newerCommit = isFirst ? fromRepoCommits[i] : fromRepoCommits[i - 1];
  if (emails.length > 0 && !emails.includes(newerCommit.author_email)) {
    continue;
  }

  const diff = await fromRepo.diffSummary([olderCommit.hash, newerCommit.hash]);

  // Fix bug where diffSummary doesn't return correct values for the first commit
  if (isFirst) {
    diff.insertions = diff.changed;
    diff.deletions = 0;
    diff.files = diff.files.map((f) => {
      if (f.binary) {
        return f;
      }
      f.insertions = f.changes;
      f.deletions = 0;
      return f;
    });
  }

  for (const file of diff.files) {
    const maskedPath = await maskPath(file.file);
    const filePath = toRepoBase + maskedPath;
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, "", { flag: "a" });

    // Binary files
    if (file.binary) {
      if (file.after === 0) {
        await unlink(filePath);
        continue;
      }

      const content = new Uint8Array(file.after).fill(0);
      await writeFile(filePath, content);
      continue;
    }

    // Text files
    const oldContent = await readFile(filePath, "utf8");
    const addedLines = new Array(file.insertions).fill(0).map(getRandomLine);
    const addedContent = oldContent + addedLines.join("");
    const removedContent = addedContent
      .split("\n")
      .slice(0, file.deletions === 0 ? undefined : -file.deletions)
      .join("\n").trim() + "\n";
      await writeFile(filePath, removedContent);

    const newContent = await readFile(filePath, "utf8");
    if (newContent.trim().length === 0) {
      await unlink(filePath);
      continue;
    }
  }

  await toRepo.add("./*").commit(newerCommit.date, {
    "--date": newerCommit.date,
  });

  const progress = ((fromRepoCommits.length - 1 - i) / (fromRepoCommits.length - 2)) *
    100;
  console.info(`${progress.toFixed(1)}% - ${newerCommit.date}`);
}

console.info("Done!");
process.exit(0);