import { loadGameContext } from './context.js';
import { formatErrorMessage, formatPlayChainSummary, buildPlayChainForwardLines } from './messages.js';
import { replyPlayChainSession } from './panel.js';
import { loadDeerData, saveDeerData } from './store.js';

/** App 层共用：配额连玩首条摘要 + 聊天记录转发 */
export async function handleQuotaChainPlay(e, {
    runSession,
    kind,
    caption,
    forwardTitle,
    messageCtx = {},
    endHint = '…配额耗尽',
    afterSuccess,
} = {}) {
    const { user_id, card, nickname } = e.sender;
    const date = new Date();
    const day = date.getDate();
    const deerData = await loadDeerData();
    const ctx = await loadGameContext(date);
    const session = runSession(deerData, user_id, date, day, ctx);
    if (!session.ok) {
        await e.reply(formatErrorMessage(session.result || session), true);
        return null;
    }
    await saveDeerData(deerData);
    const helperName = card || nickname;
    await replyPlayChainSession(e, {
        caption,
        summary: formatPlayChainSummary(session, kind),
        forwardTitle,
        endHint,
        buildLines: () => buildPlayChainForwardLines(session, { helperName, ...messageCtx }),
    });
    if (afterSuccess) {
        await afterSuccess({
            deerData, session, date, day, helperName, ctx, userId: user_id,
        });
    }
    return session;
}
