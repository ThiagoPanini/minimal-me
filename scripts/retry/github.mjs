// A porta real da nova tentativa: a API REST do GitHub pelo cliente dos scripts
// (`scripts/github-api.mjs`), com o GITHUB_TOKEN do workflow `retry`. Uma página de 100 basta:
// os PRs abertos de um repositório de um Autor só e as rodadas de um evento num commit nunca
// chegam perto disso.
import { createGitHubApi } from "../github-api.mjs";

/**
 * @param {{ repository: string, token: string, apiUrl?: string }} options
 */
export function createGitHub({ repository, token, apiUrl }) {
  const api = createGitHubApi({ token, apiUrl });
  const call = (method, path) => api.call(method, `/repos/${repository}${path}`);

  return {
    async openPullRequests() {
      const pulls = await call("GET", "/pulls?state=open&per_page=100");
      return pulls.map((pull) => ({
        number: pull.number,
        title: pull.title,
        author: { login: pull.user.login, isBot: pull.user.type === "Bot" },
        headSha: pull.head.sha,
      }));
    },
    async headOf(branch) {
      const { commit } = await call("GET", `/branches/${encodeURIComponent(branch)}`);
      return commit.sha;
    },
    async runsAt(sha, event) {
      const query = new URLSearchParams({ head_sha: sha, event, per_page: "100" });
      const { workflow_runs: runs } = await call("GET", `/actions/runs?${query}`);
      return runs.map((run) => ({
        id: run.id,
        workflowId: run.workflow_id,
        workflowName: run.name,
        event: run.event,
        headSha: run.head_sha,
        runNumber: run.run_number,
        attempt: run.run_attempt,
        status: run.status,
        conclusion: run.conclusion,
        url: run.html_url,
      }));
    },
    async rerunFailedJobs(runId) {
      await call("POST", `/actions/runs/${runId}/rerun-failed-jobs`);
    },
  };
}
