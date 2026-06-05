import path from "path";

const packageJsonPath = path.resolve(path.join('./plugins', 'yunzai-plugin-deer-pipe'));

// 本地资源
export const CHECK_IMG = `${packageJsonPath}/assets/check@96x100.png`;
export const DEERPIPE_IMG = `${packageJsonPath}/assets/deerpipe@100x82.png`;
export const MISANS_FONT = `${packageJsonPath}/assets/MiSans-Regular.ttf`;
export const PLUGIN_PATH = `${packageJsonPath}`;

// Redis 键（仅存 Redis，不写插件目录或本地文件）
export const REDIS_YUNZAI_DEER_PIPE = "Yz:deer_pipe:sign";
export const REDIS_YUNZAI_DEER_PIPE_FRIENDS = "Yz:deer_pipe:friends";
