import * as vscode from "vscode";

const GITHUB_PROVIDER_ID = "github";
const DEFAULT_SCOPES = ["read:user", "gist"];

interface GithubSessionInfo {
  accountLabel: string;
  accessToken: string;
}

export async function getGithubSession(
  createIfNone = false
): Promise<vscode.AuthenticationSession | undefined> {
  return vscode.authentication.getSession(
    GITHUB_PROVIDER_ID,
    DEFAULT_SCOPES,
    { createIfNone }
  );
}

export async function signInGithub(
  context: vscode.ExtensionContext
): Promise<GithubSessionInfo> {
  const session = await getGithubSession(true);

  if (!session) {
    throw new Error("GitHub authentication session was not created.");
  }

  await context.secrets.store("scratch.github.accessToken", session.accessToken);

  return {
    accountLabel: session.account.label,
    accessToken: session.accessToken,
  };
}

export async function signOutGithub(
  context: vscode.ExtensionContext
): Promise<void> {
  await context.secrets.delete("scratch.github.accessToken");
}
