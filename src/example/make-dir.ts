import fs from "fs";

export async function makeDir(root: string, options = {recursive: true}) {
    try {
        // 路径是否存在 存在返回true
        if (fs.existsSync(root)) {
            return "already"
        }
        // 异步创建目录
        await fs.promises.mkdir(root, options);
        return "success"
    } catch (err) {
        return "failed"
    }
}
