import ora from "ora";
import boxen from "boxen";
import chalk from "chalk";
import path from "path";
import {existsInRepo} from "./exists-in-repo";
import {GITHUB_BRANCH, GITHUB_ORG, GITHUB_REPO} from "./constants";
import {makeDir} from "./make-dir";
import {downloadAndExtract} from "./download-and-extract";


const run = async (example: string | boolean | undefined, destination?: string) => {

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


}
export default run
