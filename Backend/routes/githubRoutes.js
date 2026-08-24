const express = require("express");
const router = express.Router();
const User = require("../models/User");
const {
  exchangeCodeForToken,
  getGitHubUser,
  getUserRepos,
  getRepoBranches,
  createOrUpdateFile,
  generateFileName,
  generateCommitMessage,
  ensureDsaRepo,
} = require("../services/githubService");

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

console.log("GitHub OAuth config:", {
  clientId: !!GITHUB_CLIENT_ID,
  clientSecret: !!GITHUB_CLIENT_SECRET,
});

router.get("/auth-url", (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({ error: "GitHub OAuth not configured" });
  }
  const scope = "repo";
  const { redirect_uri } = req.query;
  let url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${scope}&state=leetbuddy`;
  if (redirect_uri) {
    url += `&redirect_uri=${encodeURIComponent(redirect_uri)}`;
  }
  res.json({ url });
});

router.post("/exchange", async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) return res.status(400).json({ error: "Missing code" });
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return res.status(500).json({ error: "GitHub OAuth not configured" });
    }

    const accessToken = await exchangeCodeForToken(
      code,
      GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET,
      redirectUri,
    );
    const githubUser = await getGitHubUser(accessToken);
    res.json({ accessToken, githubUsername: githubUser.login });
  } catch (error) {
    console.error("GitHub exchange error:", error);
    res.status(500).json({ error: error.message || "Failed to exchange code" });
  }
});

router.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  if (state !== "leetbuddy")
    return res.redirect(`${FRONTEND_URL}/settings?github_error=invalid_state`);
  if (!code)
    return res.redirect(`${FRONTEND_URL}/settings?github_error=no_code`);

  try {
    const accessToken = await exchangeCodeForToken(
      code,
      GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET,
    );
    const githubUser = await getGitHubUser(accessToken);
    res.redirect(
      `${FRONTEND_URL}/settings?github_token=${accessToken}&github_username=${githubUser.login}`,
    );
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    res.redirect(`${FRONTEND_URL}/settings?github_error=oauth_failed`);
  }
});

router.post("/connect", async (req, res) => {
  try {
    const { username, accessToken, githubUsername } = req.body;
    if (!username || !accessToken || !githubUsername)
      return res.status(400).json({ error: "Missing required fields" });

    const githubUpdate = {
      "github.connected": true,
      "github.accessToken": accessToken,
      "github.username": githubUsername,
    };

    try {
      const dsaRepo = await ensureDsaRepo(accessToken, githubUsername);
      githubUpdate["github.repo"] = dsaRepo.name;
      githubUpdate["github.branch"] = dsaRepo.default_branch || "main";
    } catch (repoError) {
      console.error("DSA repo ensure error during connect:", repoError);
    }

    const user = await User.findOneAndUpdate(
      { username },
      { $set: githubUpdate },
      { new: true },
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      success: true,
      github: {
        connected: true,
        username: githubUsername,
        repo: user.github?.repo || null,
        branch: user.github?.branch || "main",
      },
    });
  } catch (error) {
    console.error("GitHub connect error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/ensure-dsa-repo", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    const user = await User.findOne({ username });
    if (!user || !user.github?.connected || !user.github?.accessToken) {
      return res.status(400).json({ error: "GitHub not connected" });
    }

    const dsaRepo = await ensureDsaRepo(
      user.github.accessToken,
      user.github.username,
    );
    user.github.repo = dsaRepo.name;
    user.github.branch = dsaRepo.default_branch || "main";
    await user.save();

    res.json({
      success: true,
      repo: user.github.repo,
      branch: user.github.branch,
    });
  } catch (error) {
    console.error("Ensure DSA repo error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to set up DSA repository" });
  }
});

router.get("/status/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      connected: user.github?.connected || false,
      username: user.github?.username || null,
      repo: user.github?.repo || null,
      branch: user.github?.branch || "main",
    });
  } catch (error) {
    console.error("GitHub status error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/repos/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user || !user.github?.connected || !user.github?.accessToken)
      return res.status(400).json({ error: "GitHub not connected" });

    const repos = await getUserRepos(user.github.accessToken);
    res.json(
      repos.map((r) => ({
        name: r.name,
        fullName: r.full_name,
        private: r.private,
      })),
    );
  } catch (error) {
    console.error("GitHub repos error:", error);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

router.get("/branches/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { repo } = req.query;
    const user = await User.findOne({ username });

    if (!user || !user.github?.connected || !user.github?.accessToken)
      return res.status(400).json({ error: "GitHub not connected" });
    if (!repo)
      return res.status(400).json({ error: "Repo parameter required" });

    const branches = await getRepoBranches(
      user.github.accessToken,
      user.github.username,
      repo,
    );
    res.json(branches.map((b) => b.name));
  } catch (error) {
    console.error("GitHub branches error:", error);
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

router.post("/select-repo", async (req, res) => {
  try {
    const { username, repo, branch } = req.body;
    if (!username || !repo)
      return res.status(400).json({ error: "Missing required fields" });

    const user = await User.findOneAndUpdate(
      { username },
      { $set: { "github.repo": repo, "github.branch": branch || "main" } },
      { new: true },
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ success: true, repo, branch: branch || "main" });
  } catch (error) {
    console.error("GitHub select repo error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/disconnect", async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    const user = await User.findOneAndUpdate(
      { username },
      {
        $set: {
          "github.connected": false,
          "github.accessToken": null,
          "github.username": null,
          "github.repo": null,
          "github.branch": "main",
        },
      },
      { new: true },
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ success: true });
  } catch (error) {
    console.error("GitHub disconnect error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/push-solution", async (req, res) => {
  try {
    const { username, questionName, code, language, verdict } = req.body;
    if (!username || !questionName || !code)
      return res.status(400).json({ error: "Missing required fields" });
    if (verdict !== "Accepted")
      return res
        .status(400)
        .json({ error: "Only accepted solutions can be pushed" });

    const user = await User.findOne({ username });
    if (
      !user ||
      !user.github?.connected ||
      !user.github?.accessToken ||
      !user.github?.repo
    ) {
      return res.status(400).json({ error: "GitHub not fully configured" });
    }

    const fileName = generateFileName(questionName, language);
    const commitMessage = generateCommitMessage(questionName);

    await createOrUpdateFile(
      user.github.accessToken,
      user.github.username,
      user.github.repo,
      fileName,
      code,
      commitMessage,
      user.github.branch || "main",
    );

    res.json({ success: true, fileName, repo: user.github.repo });
  } catch (error) {
    console.error("GitHub push solution error:", error);
    res.status(500).json({ error: error.message || "Failed to push solution" });
  }
});

module.exports = router;
