import { Input, prompt } from "@cliffy/prompt";
import { error } from "@std/log";
import { simpleGit } from "simple-git";
import * as s from "@oxi/schema";

export async function initCli() {
  const testMode = Deno.args.includes("--test");

  const result = testMode
    ? {
      targetName: "Samuel Braun",
      targetEmail: "sam@webry.com",
      emails: "sam@webry.com",
      repoPath: "C:\\Users\\SBrau\\Desktop\\color-wizard",
      outputPath: "./.repo",
    }
    : await prompt([{
      name: "targetName",
      message: "What's your wanted git name? (user.name)",
      minLength: 1,
      type: Input,
    }, {
      name: "targetEmail",
      message: "What's your wanted git email? (user.email)",
      minLength: 6,
      type: Input,
    }, {
      name: "emails",
      message:
        "Which author's commits do you want to copy? (comma separated emails)",
      minLength: 6,
      type: Input,
    }, {
      name: "repoPath",
      message: "Where is the repository you want to copy?",
      minLength: 1,
      type: Input,
    }, {
      name: "outputPath",
      message: "Where do you want to generate the new repository?",
      minLength: 1,
      type: Input,
    }]);
  const argsResult = s.obj({
    emails: s.opt(s.str()),
    targetEmail: s.str(),
    targetName: s.str(),
    outputPath: s.str(),
    repoPath: s.str(),
  }).parse(result);
  if (argsResult.isErr()) {
    error(JSON.stringify(argsResult.unwrapErr(), null, 2));
    Deno.exit(1);
  }

  const argsOk = argsResult.unwrap();
  const emails = argsOk.emails.map((c: string) => c.split(","))
    .unwrapOr([]);
  const targetName = argsOk.targetName;
  const targetEmail = argsOk.targetEmail;
  const outputPath = argsOk.outputPath;
  const repoPath = argsOk.repoPath;

  // Validate arguments
  const fromRepo = simpleGit(repoPath);
  const isValidFromRepo = await fromRepo.checkIsRepo();
  if (!isValidFromRepo) {
    error("Invalid --repoPath. It must be a valid git repository.");
    Deno.exit(1);
  }

  const toRepo = simpleGit();
  const isValidToRepo = await toRepo.checkIsRepo();
  if (!isValidToRepo) {
    error("Invalid --outputPath. It must be a valid git repository.");
    Deno.exit(1);
  }

  await toRepo
    .addConfig("user.name", targetName)
    .addConfig("user.email", targetEmail);
  await toRepo.init();

  return { emails, targetName, targetEmail, outputPath, fromRepo, toRepo };
}
