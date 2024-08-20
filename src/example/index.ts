import ora from "ora";
import boxen from "boxen";
import chalk from "chalk";
import path from "path";
import {existsInRepo} from "./exists-in-repo";
import {GITHUB_BRANCH, GITHUB_ORG, GITHUB_REPO} from "./constants";
import {makeDir} from "./make-dir";
import {downloadAndExtract} from "./download-and-extract";
import {findPM, installDependencies} from "./install-dependencies";
import {gitInit} from "./git-init";


const run = async (example: string | boolean | undefined, destination?: string) => {
    const pm = findPM();
    if (typeof example !== 'string') {
        console.log(typeof example);
        // ora 终端spinner
        ora('you must specify an example name').fail()
        // boxen 终端盒子
        // chalk 终端字符串样式
        console.log(
            boxen([
                chalk`You can find {bold refine} examples at:`,
                "",
                chalk`{dim.cyan github.com/}{cyan refinedev/refine/tree/master/examples}`,
            ].join("\n"), {
                title: chalk`No example provided`,
                titleAlignment: "center",
                borderStyle: "round",
                borderColor: "gray",
                padding: 1,
                textAlignment: "center",
                margin: 1,
                float: "center",
            })
        )
        // 退出
        process.exit(1);
    }
    // console.log(destination || example)
    // 获取到终端命令path
    const root = path.resolve(destination || example);
    // 查询库 start loading
    const existSpinner = ora('Checking if example exists in refine').start()
    // 查询库是否存在
    const found = await existsInRepo({
        organization: GITHUB_ORG,
        repository: GITHUB_REPO,
        example,
        branch: GITHUB_BRANCH,
    })
    if (found) {
        // 查询库成功
        existSpinner.succeed('Example found in refine repository')
    } else {
        // 查询库失败
        existSpinner.fail(`Could not locate an example named ${chalk.red(`"${example}"`)}`)
        // boxen 提示
        console.log(boxen(
            [
                chalk`You can find {bold refine} examples at:`,
                "",
                chalk`{dim.cyan github.com/}{cyan refinedev/refine/tree/master/examples}`,
            ].join("\n"),
            {
                title: chalk`Example not found`,
                titleAlignment: "center",
                borderStyle: "round",
                borderColor: "gray",
                padding: 1,
                textAlignment: "center",
                margin: 1,
                float: "center",
            },
        ),)
        // 退出
        process.exit(1);
    }
    console.log(root)
    // 获取到终端工作目录
    // replace将相同的string替换为后部分
    const cdPath = root.includes(path.resolve(process.cwd())) ? root.replace(path.resolve(process.cwd()), ".") : root
    const dirSpinner = ora(`Creating directory ${chalk.cyan(cdPath)}.`).start();
    // 创建目录的状态
    const dirStatus = await makeDir(root)
    // 处理状态 提示
    if (dirStatus === "already") {
        dirSpinner.warn(
            `Directory ${chalk.cyan(
                cdPath,
            )} already exists. Files will be overwritten.`,
        );
    } else if (dirStatus === "failed") {
        dirSpinner.fail(`Failed to create directory ${chalk.cyan(cdPath)}.`);
        process.exit(1);
    } else {
        dirSpinner.succeed(`Directory ${chalk.cyan(cdPath)} created.`);
    }
    const downloadSpinner = ora(`Downloading files for example ${chalk.cyan(
        example,
    )}. This might take a moment.`,).start()

    const downloadStatus = await downloadAndExtract({
        root,
        name: example,
        branch: GITHUB_BRANCH,
        repo: GITHUB_REPO,
        org: GITHUB_ORG,
    })
    if (downloadStatus==='download-failed'){
        downloadSpinner.fail(`Failed to download files for example ${chalk.cyan(example)}.`)
        process.exit(1);
    }
    if (downloadStatus==='extract-failed'){
        downloadSpinner.fail(`Failed to extract files for example ${chalk.cyan(example)}.`)
        process.exit(1);
    }
    // 下载成功
    downloadSpinner.succeed(
        `Files downloaded and extracted for example ${chalk.cyan(example)}.`,
    )

    const installSpinner = ora(
        "Installing packages. This might take a couple of minutes.",
    ).start();

    const installStatus = await installDependencies(root)

    if (installStatus) {
        installSpinner.succeed("Packages installed successfully.");
    }else {
        installSpinner.fail(
            "Failed to install packages. You can try again manually.",
        );
    }

    const gitSpinner = ora(`Initializing Git in ${chalk.cyan(cdPath)}.`).start();

    const gitStatus = gitInit(root, "Initial commit from Create Refine App");
    if (gitStatus === "git-not-found") {
        gitSpinner.warn(
            "Git was not found in your PATH. Skipping Git initialization.",
        );
    }

    if (gitStatus === "already-in-repository") {
        gitSpinner.warn(
            `Directory ${chalk.cyan(
                cdPath,
            )} is already a Git repository. Skipping Git initialization.`,
        );
    }

    if (gitStatus === "git-init-failed") {
        gitSpinner.warn(
            `Failed to initialize Git repository in ${chalk.cyan(cdPath)}.`,
        );
    }

    if (gitStatus === "git-commit-failed") {
        gitSpinner.warn(
            `Failed to commit initial commit to Git repository in ${chalk.cyan(
                cdPath,
            )}.`,
        );
    }

    if (gitStatus === "success") {
        gitSpinner.succeed("Created Git repository with initial commit.");
    }

    const pmRun = pm === "yarn" ? "" : "run ";

    console.log(
        boxen(
            [
                chalk`Created {cyan ${example}} at {cyan ${cdPath}}`,
                "",
                chalk`Start using your new {bold refine} app by running:`,
                "",
                chalk`  {bold cd} {cyan ${cdPath}}`,
                chalk`  {bold ${pm} ${pmRun}}{cyan dev}`,
            ].join("\n"),
            {
                // title: `create-refine-app${version ? ` v${version}` : ""}`,
                title: chalk`{bold.green Success!}`,
                titleAlignment: "center",
                borderStyle: "round",
                padding: 1,
                float: "center",
                margin: 1,
                borderColor: "gray",
            },
        ),
    );
}
export default run
