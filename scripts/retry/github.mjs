// A porta real da nova tentativa: a API REST do GitHub por `fetch`, com o GITHUB_TOKEN do
// workflow `retry`. Uma página de 100 basta: os PRs abertos de um repositório de um Autor só e as
// rodadas de um evento num commit nunca chegam perto disso.
const apiVersion = "2022-11-28";

/**
 * @param {{ repository: string, token: string, apiUrl?: string }} options
 */
export function createGitHub({ repository, token, apiUrl = "https://api.github.com" }) {
  async function call(method, path) {
    const response = await fetch(`${apiUrl}/repos/${repository}${path}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": apiVersion,
      },
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 200);
      throw new Error(`${method} ${path} respondeu ${response.status}: ${detail}`);
    }
    return response.status === 204 || response.status === 201 ? null : response.json();
  }

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
