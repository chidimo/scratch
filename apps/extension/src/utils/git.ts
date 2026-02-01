import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface GitUserIdentity {
  name?: string;
  email?: string;
  source: "git";
}

async function getGitConfigValue(
  cwd: string,
  key: string
): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", ["config", "--get", key], {
      cwd,
    });

    const value = stdout.trim();
    return value.length > 0 ? value : undefined;
  } catch (error) {
    return undefined;
  }
}

export async function getGitUserIdentity(
  cwd: string
): Promise<GitUserIdentity | null> {
  const [name, email] = await Promise.all([
    getGitConfigValue(cwd, "user.name"),
    getGitConfigValue(cwd, "user.email"),
  ]);

  if (!name && !email) {
    return null;
  }

  return {
    name,
    email,
    source: "git",
  };
}
