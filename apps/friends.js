import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import FriendsModel from "../model/friends.js";
import { isNumeric } from "../utils/common.js";
import {
    addFriendBond,
    buildFriendCards,
    getHelpTargets,
    removeFriendBond,
} from "../utils/friends.js";
import {
    formatFriendAddMessage,
    formatFriendAlready,
    formatFriendEmpty,
    formatFriendNotInGroup,
    formatFriendRemoveMessage,
    pickFriendListTitle,
} from "../utils/messages.js";
import { REG } from "../constants/commands.js";
import { resolveFriendTargetId } from "../utils/plugin-common.js";
import { loadFriends, saveFriends } from "../utils/store.js";

export class Friends extends plugin {
    constructor() {
        super({
            name: "帮🦌",
            dsc: "添加🦌友，一次添加双向结缘",
            event: "message",
            priority: 5000,
            bypassThrottle: true,
            rule: [
                { reg: REG.addFriend, fnc: "addDeerFriend" },
                { reg: REG.delFriend, fnc: "delDeerFriend" },
                { reg: REG.myFriend, fnc: "myDeerFriend" },
            ],
        });
    }

    async getGroupUserInfo(e) {
        const curGroup = e.group || Bot?.pickGroup(e.group_id);
        return curGroup?.getMemberMap();
    }

    extractDeerNickname(membersMap, userId) {
        const info = membersMap.get(parseInt(userId));
        return info?.card || info?.nickname || userId;
    }

    async renderFriendList(e, friendsData, myNickName, listTitle) {
        const data = await new FriendsModel(e).getData(friendsData, myNickName, {
            listTitle,
            friendCount: friendsData.length,
        });
        return puppeteer.screenshot("friends", data);
    }

    async addDeerFriend(e) {
        const { user_id, card, nickname } = e.sender;
        const targetId = await resolveFriendTargetId(e);
        if (!targetId || !isNumeric(String(targetId))) {
            e.reply("无法获取🦌友信息，请 @ 或引用对方消息", true);
            return;
        }
        if (String(targetId) === String(user_id)) {
            e.reply("不能添加自己为🦌友哦", true);
            return;
        }

        const friends = await loadFriends();
        if (!addFriendBond(friends, user_id, targetId)) {
            e.reply(formatFriendAlready(), true);
            return;
        }
        await saveFriends(friends);
        const membersMap = await this.getGroupUserInfo(e);
        const targetName = this.extractDeerNickname(membersMap, targetId);
        const myName = card || nickname;
        const deerData = buildFriendCards(friends, user_id, membersMap);
        if (!deerData.length) {
            e.reply(formatFriendAddMessage(myName, targetName), true);
            return;
        }

        const img = await this.renderFriendList(e, deerData, myName, pickFriendListTitle());
        e.reply([formatFriendAddMessage(myName, targetName), img], true);
    }

    async delDeerFriend(e) {
        const { user_id, card, nickname } = e.sender;
        const targetId = await resolveFriendTargetId(e, { remove: true });
        if (!targetId || !isNumeric(String(targetId))) {
            e.reply("无法获取🦌友信息，请 @ 或引用对方消息", true);
            return;
        }

        const friends = await loadFriends();
        if (!removeFriendBond(friends, user_id, targetId)) {
            e.reply("🦌友不在名单中！", true);
            return;
        }
        await saveFriends(friends);
        const membersMap = await this.getGroupUserInfo(e);
        const targetName = this.extractDeerNickname(membersMap, targetId);
        const myName = card || nickname;
        const deerData = buildFriendCards(friends, user_id, membersMap);
        if (!deerData.length) {
            e.reply(formatFriendRemoveMessage(myName, targetName), true);
            return;
        }

        const img = await this.renderFriendList(e, deerData, myName, pickFriendListTitle());
        e.reply([formatFriendRemoveMessage(myName, targetName), img], true);
    }

    async myDeerFriend(e) {
        const { user_id, card, nickname } = e.sender;
        const friends = await loadFriends();
        if (!getHelpTargets(friends, user_id).length) {
            e.reply(formatFriendEmpty(), true);
            return;
        }

        const membersMap = await (e.group || Bot?.pickGroup(e.group_id))?.getMemberMap();
        const deerData = buildFriendCards(friends, user_id, membersMap);
        if (!deerData.length) {
            e.reply(formatFriendNotInGroup(), true);
            return;
        }

        const img = await this.renderFriendList(e, deerData, card || nickname, pickFriendListTitle());
        e.reply(img);
    }
}
