import { Octokit } from "@octokit/rest";
import * as vscode from "vscode";

export interface GistSummary {
  id: string;
  description: string | null;
  htmlUrl: string;
  fileCount: number;
}

export async function syncGists(options: {
  accessToken: string;
  outputChannel: vscode.OutputChannel;
}): Promise<GistSummary[]> {
  const octokit = new Octokit({ auth: options.accessToken });
  options.outputChannel.appendLine("Scratchpad: syncing GitHub Gists...");

  const response = await octokit.request("GET /gists", {
    per_page: 20,
    page: 1,
  });

  type GistItem = (typeof response.data)[number];
  const summaries = response.data.map((gist: GistItem) => ({
    id: gist.id,
    description: gist.description ?? null,
    htmlUrl: gist.html_url,
    fileCount: Object.keys(gist.files ?? {}).length,
  }));

  options.outputChannel.appendLine(
    `Scratchpad: fetched ${summaries.length} gist(s).`
  );

  for (const gist of summaries) {
    const label = gist.description?.trim() || "Untitled gist";
    options.outputChannel.appendLine(
      `- ${label} (${gist.fileCount} files) -> ${gist.htmlUrl}`
    );
  }

  return summaries;
}
