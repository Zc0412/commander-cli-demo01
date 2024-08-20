import {join} from "path";
import tar from "tar";
import {promisify} from "util";
import {Stream} from "stream";
import got from "got";
import {createWriteStream, promises as fs} from "fs";

const pipeline = promisify(Stream.pipeline);
// 临时前缀
const TEMP_PREFIX = ".refine-example.temp";

async function downloadTar(url: string) {
    // join方法使用特定于平台的分隔符作为定界符将所有给定的 path 片段连接在一起，然后规范化生成的路径。
    const tempFile = join(process.cwd(), `${TEMP_PREFIX}-${Date.now()}`);
    console.log("tempFile",tempFile)
    try {
        await pipeline(got.stream(url), createWriteStream(tempFile))
        return tempFile;
    } catch (error) {
        try {
            // 删除文件
            await fs.unlink(tempFile);
        } catch (err) {
        }
        return undefined
    }
}

export async function downloadAndExtract(
    {
        root,
        name,
        branch,
        repo,
        org,
    }: {
        root: string;
        name: string;
        branch: string;
        repo: string;
        org: string;
    }) {
    console.log('Tar start')
    const tempFile = await downloadTar(`https://codeload.github.com/${org}/${repo}/tar.gz/${branch}`);
    if (!tempFile) {
        return 'download-failed'
    }
    console.log("下载成功，即将开始解压")
    try {
        // tar有5个顶级的命令,x可以用来解压
        await tar.x({
            file: tempFile,
            cwd: root,
            strip: 3,
            filter: (p) => {
                return !!p.includes(`${repo}-${branch}/examples/${name}/`);

            }
        })
    } catch (error) {
        try {
            await fs.unlink(tempFile);
        } catch (error) {
        }
        return 'extract-failed'
    }
    try {
        await fs.unlink(tempFile);
    } catch (error) {
    }
    return 'success'
}
