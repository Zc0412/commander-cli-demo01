import execa from "execa";
import rimraf from "rimraf";
import path from "path";


function isInMercurialRepository(root: string): boolean {
    try {
        execa.commandSync("hg --cwd . root", {stdio: "ignore", cwd: root});
        return true;
    } catch (_) {
    }
    return false;
}

function isInGitRepository(root: string): boolean {
    try {
        execa.commandSync("git rev-parse --is-inside-work-tree", {
            stdio: "ignore",
            cwd: root,
        });
        return true;
    } catch (_) {
    }
    return false;
}

export function gitInit(root: string, message: string) {
    let didInit = false;
    // 检查git版本
    try {
        execa.commandSync('git --version', {
            stdio: "ignore", cwd: root
        })
    } catch (err) {
        return 'git-not-found';
    }
    if (isInGitRepository(root) || isInMercurialRepository(root)) {
        // 检查是否已经存在存储库中
        return 'already-in-repository';
    }
    // init git
    try {
        execa.commandSync("git init", {stdio: "ignore", cwd: root});
    } catch (err) {
        return 'git-init-failed';
    }
    didInit = true;

    // 签出main分支 修改仓库记录
    try {
        execa.commandSync("git checkout -b main", {
            stdio: "ignore",
            cwd: root,
        });
        execa.sync("git", ["commit", `--message="${message}"`], {
            stdio: "ignore",
            cwd: root,
        });
    } catch (err) {
        if (didInit) {
            try {
                // 删除.git
                rimraf.sync(path.join(root, `.git`), {})
            } catch (err) {
                return 'git-commit-failed';
            }
        }
    }
    return 'success'
}
