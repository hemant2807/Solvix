const GITHUB_API = "https://api.github.com";
const GITHUB_OAUTH_URL = "https://github.com/login/oauth";

function getHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json"
  };
}

async function exchangeCodeForToken(code, clientId, clientSecret, redirectUri) {
  const body = {
    client_id: clientId,
    client_secret: clientSecret,
    code
  };
  if (redirectUri) body.redirect_uri = redirectUri;

  const response = await fetch(`${GITHUB_OAUTH_URL}/access_token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || "Failed to exchange code for token");
  }
  return data.access_token;
}

async function getGitHubUser(accessToken) {
  const response = await fetch(`${GITHUB_API}/user`, {
    headers: getHeaders(accessToken)
  });
  if (!response.ok) throw new Error("Failed to fetch GitHub user");
  return response.json();
}

async function getUserRepos(accessToken) {
  const response = await fetch(`${GITHUB_API}/user/repos?sort=updated&per_page=100`, {
    headers: getHeaders(accessToken)
  });
  if (!response.ok) throw new Error("Failed to fetch repos");
  return response.json();
}

async function getRepo(accessToken, owner, repo) {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: getHeaders(accessToken)
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to look up repository");
  return response.json();
}

async function createRepo(accessToken, repoName) {
  const response = await fetch(`${GITHUB_API}/user/repos`, {
    method: "POST",
    headers: getHeaders(accessToken),
    body: JSON.stringify({
      name: repoName,
      description: "LeetCode solutions synced by LeetBuddy",
      private: false,
      auto_init: true
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to create repository");
  }

  return response.json();
}

const DSA_REPO_NAME = "DSA";

async function ensureDsaRepo(accessToken, owner) {
  const existing = await getRepo(accessToken, owner, DSA_REPO_NAME);
  if (existing) return existing;
  return createRepo(accessToken, DSA_REPO_NAME);
}

async function getRepoBranches(accessToken, owner, repo) {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/branches`, {
    headers: getHeaders(accessToken)
  });
  if (!response.ok) throw new Error("Failed to fetch branches");
  return response.json();
}

async function createOrUpdateFile(accessToken, owner, repo, path, content, message, branch) {
  let sha = null;
  const getResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`, {
    headers: getHeaders(accessToken)
  });
  
  if (getResponse.ok) {
    const fileData = await getResponse.json();
    sha = fileData.sha;
  }

  const body = {
    message,
    content: Buffer.from(content).toString("base64"),
    branch
  };
  
  if (sha) body.sha = sha;

  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: "PUT",
    headers: getHeaders(accessToken),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create/update file");
  }

  return response.json();
}

function getFileExtension(language) {
  const extMap = {
    "python": "py", "python3": "py", "java": "java", "cpp": "cpp",
    "c++": "cpp", "c": "c", "javascript": "js", "typescript": "ts",
    "go": "go", "rust": "rs", "ruby": "rb", "swift": "swift",
    "kotlin": "kt", "scala": "scala", "c#": "cs", "csharp": "cs",
    "php": "php", "dart": "dart", "r": "r", "racket": "rkt",
    "erlang": "erl", "elixir": "ex", "haskell": "hs", "ocaml": "ml",
    "f#": "fs", "fsharp": "fs", "vb.net": "vb", "visual basic": "vb",
    "lua": "lua", "perl": "pl", "bash": "sh", "shell": "sh",
    "powershell": "ps1", "sql": "sql", "html": "html", "css": "css",
    "json": "json", "xml": "xml", "yaml": "yml", "markdown": "md",
    "text": "txt"
  };
  return extMap[language.toLowerCase()] || "txt";
}

function generateFileName(questionName, language) {
  const safeName = questionName
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const ext = getFileExtension(language);
  return `${safeName}.${ext}`;
}

function generateCommitMessage(questionName) {
  return `feat(dsa): add ${questionName} solution`;
}

module.exports = {
  exchangeCodeForToken, getGitHubUser, getUserRepos, getRepo,
  createRepo, ensureDsaRepo, DSA_REPO_NAME, getRepoBranches,
  createOrUpdateFile, getFileExtension, generateFileName,
  generateCommitMessage
};