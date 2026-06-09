export {
    PLUGIN_PATH,
    ASSET_ROOT,
    professionArtPath,
    skillArtPath,
    sectionArtPath,
    PROFESSION_CATALOG_ART,
    DEERPIPE_LOGO,
    CHECK_MARK,
    DEER_FONT,
    HELP_SECTION_ART,
    verifyArtManifest,
} from './deer-assets.js';

export { DEERPIPE_LOGO as DEERPIPE_IMG, CHECK_MARK as CHECK_IMG } from './deer-assets.js';

// Redis 键（仅存 Redis，不写插件目录或本地文件）
export const REDIS_YUNZAI_DEER_PIPE = "Yz:deer_pipe:sign";
export const REDIS_YUNZAI_DEER_PIPE_FRIENDS = "Yz:deer_pipe:friends";
export const REDIS_YUNZAI_DEER_PIPE_WEATHER = "Yz:deer_pipe:weather";
/** 帮鹿/帮戒永久日志（清算、清空配额不删） */
export const REDIS_YUNZAI_DEER_PIPE_HELP_LOG = "Yz:deer_pipe:help_log";
/** 日度鹿王加冕存档 */
export const REDIS_YUNZAI_DEER_PIPE_KING_ARCHIVE = "Yz:deer_pipe:king_archive";
/** 每日 0:00 职业重置群播去重（按自然日） */
export const REDIS_YUNZAI_DEER_PIPE_PROF_RESET_SENT = "Yz:deer_pipe:prof_reset_sent";
