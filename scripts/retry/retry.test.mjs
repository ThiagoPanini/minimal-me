// A nova tentativa diária com um GitHub falso: PRs abertos, a ponta da `main` e as rodadas de
// cada commit ficam na memória, e o falso anota as rodadas que recebem os jobs que falharam de
// novo. Cada teste monta só o que importa para a escolha.
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { retryFailedRuns } from "./retry.mjs";

const mainHead = "a".repeat(40);
const robotHead = "b".repeat(40);

const dependabot = { login: "dependabot[bot]", isBot: true };

function robotPullRequest(overrides = {}) {
  return {
    number: 12,
    title: "build(deps): bump the npm group with 3 updates",
    author: dependabot,
    headSha: robotHead,
    ...overrides,
  };
}

let nextRunId = 100;

function run(overrides = {}) {
  nextRunId += 1;
  return {
    id: nextRunId,
    workflowId: 1,
    workflowName: "ci",
    event: "pull_request",
    headSha: robotHead,
    runNumber: nextRunId,
    attempt: 1,
    status: "completed",
    conclusion: "failure",
    ...overrides,
  };
}

function fakeGitHub({ pullRequests = [], runs = [], head = mainHead } = {}) {
  const rerun = [];
  const lines = [];
  const github = {
    async openPullRequests() {
      return pullRequests;
    },
    async headOf(branch) {
      assert.equal(branch, "main");
      return head;
    },
    async runsAt(sha, event) {
      return runs.filter((item) => item.headSha === sha && item.event === event);
    },
    async rerunFailedJobs(runId) {
      rerun.push(runId);
    },
  };
  return { github, rerun, log: (line) => lines.push(line), lines };
}

describe("the daily retry", () => {
  test("reruns the failed run of a robot PR", async () => {
    const failed = run();
    const fake = fakeGitHub({ pullRequests: [robotPullRequest()], runs: [failed] });

    await retryFailedRuns(fake);

    assert.deepEqual(fake.rerun, [failed.id]);
  });

  test("leaves a human PR to whoever opened it", async () => {
    const humanHead = "c".repeat(40);
    const fake = fakeGitHub({
      pullRequests: [
        robotPullRequest({
          number: 13,
          title: "feat(web): abertura da Home",
          author: { login: "ThiagoPanini", isBot: false },
          headSha: humanHead,
        }),
      ],
      runs: [run({ headSha: humanHead })],
    });

    await retryFailedRuns(fake);

    assert.deepEqual(fake.rerun, []);
  });

  test("reruns what failed, timed out or was cancelled, and nothing else", async () => {
    const outcomes = [
      ["completed", "failure"],
      ["completed", "timed_out"],
      ["completed", "cancelled"],
      ["completed", "success"],
      ["completed", "skipped"],
      ["completed", "neutral"],
      ["completed", "action_required"],
      ["completed", "startup_failure"],
      ["in_progress", null],
      ["queued", null],
    ];
    const runs = outcomes.map(([status, conclusion], index) =>
      run({ workflowId: index + 1, workflowName: `${status}/${conclusion}`, status, conclusion }),
    );
    const fake = fakeGitHub({ pullRequests: [robotPullRequest()], runs });

    await retryFailedRuns(fake);

    assert.deepEqual(
      fake.rerun.map((id) => runs.find((item) => item.id === id).workflowName),
      ["completed/failure", "completed/timed_out", "completed/cancelled"],
    );
  });

  test("reruns the latest main run, the push of the tip commit", async () => {
    const olderMain = "d".repeat(40);
    const latest = run({ event: "push", headSha: mainHead });
    const older = run({ event: "push", headSha: olderMain });
    const rollback = run({
      workflowId: 3,
      workflowName: "rollback",
      event: "workflow_dispatch",
      headSha: mainHead,
    });
    const fake = fakeGitHub({ runs: [older, rollback, latest] });

    await retryFailedRuns(fake);

    assert.deepEqual(fake.rerun, [latest.id]);
  });

  test("a refused retry does not stop the others and goes into the report", async () => {
    const refused = run();
    const latest = run({ event: "push", headSha: mainHead });
    const fake = fakeGitHub({ pullRequests: [robotPullRequest()], runs: [refused, latest] });
    const rerunFailedJobs = fake.github.rerunFailedJobs;
    fake.github.rerunFailedJobs = async (runId) => {
      if (runId === refused.id) throw new Error("POST rerun-failed-jobs respondeu 403");
      await rerunFailedJobs(runId);
    };

    const report = await retryFailedRuns(fake);

    assert.deepEqual(fake.rerun, [latest.id]);
    assert.deepEqual(
      report.refused.map((item) => [item.run.id, item.reason]),
      [[refused.id, "POST rerun-failed-jobs respondeu 403"]],
    );
  });

  test("on a PR, only the runs of the pull_request event", async () => {
    const validation = run();
    const dependabotUpdate = run({
      workflowId: 9,
      workflowName: "Dependabot Updates",
      event: "dynamic",
    });
    const fake = fakeGitHub({
      pullRequests: [robotPullRequest()],
      runs: [dependabotUpdate, validation],
    });

    await retryFailedRuns(fake);

    assert.deepEqual(fake.rerun, [validation.id]);
  });

  test("looks only at the most recent run of each workflow at the commit", async () => {
    const superseded = run({ runNumber: 7 });
    const latest = run({ runNumber: 8, conclusion: "success" });
    const otherWorkflow = run({ workflowId: 2, workflowName: "pr-title", runNumber: 3 });
    const fake = fakeGitHub({
      pullRequests: [robotPullRequest()],
      runs: [latest, superseded, otherWorkflow],
    });

    await retryFailedRuns(fake);

    assert.deepEqual(fake.rerun, [otherWorkflow.id]);
  });

  test("gives the third retry to whoever failed on the third run", async () => {
    const failed = run({ attempt: 3 });
    const fake = fakeGitHub({ pullRequests: [robotPullRequest()], runs: [failed] });

    await retryFailedRuns(fake);

    assert.deepEqual(fake.rerun, [failed.id]);
  });

  test("stops after three retries and warns that the run stays with the agent", async () => {
    const failed = run({ attempt: 4 });
    const fake = fakeGitHub({ pullRequests: [robotPullRequest()], runs: [failed] });

    const report = await retryFailedRuns(fake);

    assert.deepEqual(fake.rerun, []);
    assert.deepEqual(
      report.exhausted.map((item) => item.run.id),
      [failed.id],
    );
  });
});
