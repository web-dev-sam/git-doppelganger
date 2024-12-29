import { simpleGit } from "simple-git";
import * as s from "@oxi/schema";
import prompts, { type PromptObject } from "prompts";
import process from "node:process";
import { processArgs } from "./args.ts";
import { ensureEmptyFolder } from "./utils.ts";


export async function initCli() {
  const args = await processArgs(process.argv.slice(2) || Deno.args);
  if (!args) {
    process.exit(1);
  }

  const result = await prompts(
    [
      {
        type: "text",
        name: "targetName",
        message: "What's your wanted git name (user.name)?",
        validate: (value: string) =>
          value.length >= 1 || "Name must not be empty",
      },
      {
        type: "text",
        name: "targetEmail",
        message: "What's your wanted git email (user.email)?",
        validate: (value: string) =>
          value.length >= 6 || "Email must be at least 6 characters",
      },
      {
        type: "text",
        name: "emails",
        message:
          "Which author's commits do you want to copy? (comma separated emails)",
        validate: (value: string) =>
          value.length >= 6 || "Emails must be at least 6 characters",
      },
    ] satisfies PromptObject[],
  );
  const argsResult = s.obj({
    emails: s.opt(s.str()),
    targetEmail: s.str(),
    targetName: s.str(),
  }).parse(result);
  if (argsResult.isErr()) {
    console.error(JSON.stringify(argsResult.unwrapErr(), null, 2));
    process.exit(1);
  }

  const argsOk = argsResult.unwrap();
  const emails = argsOk.emails.map((c: string) => c.split(","))
    .unwrapOr([]);
  const targetName = argsOk.targetName;
  const targetEmail = argsOk.targetEmail;
  const fromPath = args.from;
  const toPath = args.to;

  const fromRepo = simpleGit(fromPath);
  const isValidFromRepo = await fromRepo.checkIsRepo();
  if (!isValidFromRepo) {
    console.error("Invalid --repoPath. It must be a valid git repository.");
    process.exit(1);
  }

  const toRepoBase = await ensureEmptyFolder(toPath);
  const toRepo = simpleGit(toPath);
  await toRepo.init();
  await toRepo
    .addConfig("user.name", targetName)
    .addConfig("user.email", targetEmail);

  return {
    emails,
    targetName,
    targetEmail,
    toPath,
    fromRepo,
    toRepo,
    toRepoBase,
  };
}
