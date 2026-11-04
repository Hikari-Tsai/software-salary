let starRequest: Promise<number | null> | null = null;

async function fetchStars(): Promise<number | null> {
  try {
    const response = await fetch("https://api.github.com/repos/Hikari-Tsai/software-salary", {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const count = (await response.json())?.stargazers_count;
    return Number.isSafeInteger(count) && count >= 0 ? count : null;
  } catch {
    // Offline, timeout or API failure: leave the original link usable.
    return null;
  }
}

// Called only after hydration. Share one request across both buttons and Strict Mode effects.
// No polling or automatic retries; a full page reload performs a fresh lookup.
export function loadGithubStars(): Promise<number | null> {
  starRequest ??= fetchStars();
  return starRequest;
}
