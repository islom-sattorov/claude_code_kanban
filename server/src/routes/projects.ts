import { Router, type Request, type Response } from "express";
import { rmSync } from "fs";
import { generateClaudeMd } from "../agent/ClaudeMdGenerator";
import {
	cloneProject,
	getProjectPath,
	isProjectCloned,
	pullProject,
	recloneProject,
} from "../git/repoManager";
import { sseEmitter } from "../sse/sseEmitter";
import { projectStore } from "../store/projectStore";
import { getConfig } from "./config";

interface IdParam {
	id: string;
}

const router = Router();

// Search a GitHub user's repositories
router.get("/search", async (req: Request, res: Response) => {
	const user = (req.query.user as string | undefined)?.trim();
	if (!user) {
		res.status(400).json({ error: "user query param is required" });
		return;
	}

	const { githubPat } = getConfig();
	const headers: Record<string, string> = {
		Accept: "application/vnd.github.v3+json",
		"User-Agent": "ai-kanban",
	};
	if (githubPat) headers["Authorization"] = `Bearer ${githubPat}`;

	try {
		const response = await fetch(
			`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=updated&type=all`,
			{ headers },
		);

		if (response.status === 404) {
			res.status(404).json({ error: `GitHub user "${user}" not found` });
			return;
		}
		if (!response.ok) {
			res
				.status(response.status)
				.json({ error: `GitHub API error: ${response.statusText}` });
			return;
		}

		const repos = (await response.json()) as Record<string, unknown>[];
		res.json(
			repos.map((r) => ({
				name: r.name,
				fullName: r.full_name,
				description: r.description ?? null,
				defaultBranch: r.default_branch,
				private: r.private,
				stars: r.stargazers_count,
				language: r.language ?? null,
				updatedAt: r.updated_at,
				cloneUrl: r.clone_url,
				htmlUrl: r.html_url,
			})),
		);
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

router.get("/", async (_req: Request, res: Response) => {
	const projects = await projectStore.getAll();
	res.json(projects);
});

router.post("/", async (req: Request, res: Response) => {
	const { name, repoUrl, branch } = req.body;
	if (!name || !repoUrl) {
		res.status(400).json({ error: "name and repoUrl are required" });
		return;
	}

	try {
		const project = await projectStore.create({ name, repoUrl, branch });

		// Respond immediately — clone + CLAUDE.md generation run in the background
		res.status(201).json(project);

		const { githubPat } = getConfig();
		(async () => {
			try {
				cloneProject(project.id, repoUrl, githubPat || undefined, branch);
				sseEmitter.broadcast({ type: 'project:cloned', payload: { projectId: project.id, status: 'cloned' } });
				await generateClaudeMd(getProjectPath(project.id));
				sseEmitter.broadcast({ type: 'project:cloned', payload: { projectId: project.id, status: 'ready' } });
			} catch (err) {
				console.error(`[Project] Failed to clone ${project.id}:`, (err as Error).message);
				sseEmitter.broadcast({ type: 'project:cloned', payload: { projectId: project.id, status: 'error', error: (err as Error).message } });
			}
		})();
	} catch (err) {
		res.status(500).json({ error: (err as Error).message });
	}
});

router.post("/:id/pull", async (req: Request<IdParam>, res: Response) => {
	const project = await projectStore.getById(req.params.id);
	if (!project) {
		res.status(404).json({ error: "Project not found" });
		return;
	}
	// Respond immediately — pull + CLAUDE.md regeneration run in the background
	res.json(project);

	(async () => {
		try {
			if (isProjectCloned(project.id)) {
				pullProject(project.id);
			} else {
				const { githubPat } = getConfig();
				cloneProject(project.id, project.repoUrl, githubPat || undefined, project.branch);
			}
			sseEmitter.broadcast({ type: 'project:cloned', payload: { projectId: project.id, status: 'cloned' } });
			await generateClaudeMd(getProjectPath(project.id));
			sseEmitter.broadcast({ type: 'project:cloned', payload: { projectId: project.id, status: 'ready' } });
		} catch (err) {
			console.error(`[Project] Failed to pull ${project.id}:`, (err as Error).message);
			sseEmitter.broadcast({ type: 'project:cloned', payload: { projectId: project.id, status: 'error', error: (err as Error).message } });
		}
	})();
});

router.delete("/:id", async (req: Request<IdParam>, res: Response) => {
	const project = await projectStore.getById(req.params.id);
	if (!project) {
		res.status(404).json({ error: "Project not found" });
		return;
	}
	// Remove local clone
	try {
		rmSync(project.localPath, { recursive: true, force: true });
	} catch {
		// best-effort cleanup
	}
	const deleted = await projectStore.delete(req.params.id);
	if (!deleted) {
		res.status(404).json({ error: "Project not found" });
		return;
	}
	res.status(204).send();
});

export default router;
