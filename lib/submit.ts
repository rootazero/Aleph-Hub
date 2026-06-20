const REPO = "https://github.com/rootazero/Aleph-Hub";

export interface SubmitInput { repo: string; name: string; category: string; description: string; tags: string; }

export function buildIssueUrl(input: SubmitInput): string {
  const body = [
    `Repo: ${input.repo}`, `Name: ${input.name}`, `Category: ${input.category}`,
    `Description: ${input.description}`, `Tags: ${input.tags}`,
  ].join("\n");
  const params = new URLSearchParams({
    template: "suggest-extension.yml",
    title: `Suggest extension: ${input.name}`,
    body,
  });
  return `${REPO}/issues/new?${params.toString()}`;
}
