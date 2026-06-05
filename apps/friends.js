import puppeteer from "../../../lib/puppeteer/puppeteer.js";

import FriendsModel from "../model/friends.js";

import { isNumeric } from "../utils/common.js";

import {
    addFriendTarget,
    getHelpTargets,
    removeFriendTarget,
} from "../utils/friends.js";
import { loadFriends, saveFriends } from "../utils/store.js";



export class Friends extends plugin {

    constructor() {

        super({

            name: "帮🦌",

            dsc: "单向添加🦌友，可帮 ta 🦌或救活",

            event: "message",

            priority: 5000,

            rule: [

                {

                    reg: "^添加(🦌|鹿)友(.*)",

                    fnc: "addDeerFriend",

                },

                {

                    reg: "^绝交(🦌|鹿)友(.*)",

                    fnc: "delDeerFriend",

                },

                {

                    reg: "^我的(🦌|鹿)友$",

                    fnc: "myDeerFriend",

                }

            ]

        })

    }



    async getGroupUserInfo(e) {

        const curGroup = e.group || Bot?.pickGroup(e.group_id);

        return curGroup?.getMemberMap();

    }



    generateDeerData(friends, helperId, membersMap) {

        return getHelpTargets(friends, helperId).filter(item => {

            return membersMap.get(parseInt(item)) !== undefined;

        }).map(item => {

            const groupInfo = membersMap.get(parseInt(item));

            return {

                user_id: item,

                nickname: groupInfo?.card || groupInfo?.nickname

            };

        });

    }



    extractDeerNickname(membersMap, userId) {

        const info = membersMap.get(parseInt(userId));

        return info?.nickname || info?.card || userId;

    }



    async addDeerFriend(e) {

        const user = e.sender;

        const { user_id, nickname, card } = user;

        let targetId = null;



        if (e.at) {

            targetId = e.at;

        } else if (e?.reply_id !== undefined) {

            targetId = (await e.getReply()).user_id;

        } else {

            targetId = e.msg.replace(/添加(🦌|鹿)友/g, "").trim();

        }



        if (!targetId || !isNumeric(String(targetId))) {

            e.reply("无法获取🦌友信息，请 @ 或引用对方消息", true);

            return;

        }



        if (String(targetId) === String(user_id)) {

            e.reply("不能添加自己为🦌友哦（虽然你也可以帮自己…但不行）", true);

            return;

        }



        const friends = await loadFriends();

        if (!addFriendTarget(friends, user_id, targetId)) {

            e.reply("🦌友已在名单中！", true);

            return;

        }

        await saveFriends(friends);



        const membersMap = await this.getGroupUserInfo(e);

        const deerData = this.generateDeerData(friends, user_id, membersMap);

        const targetName = this.extractDeerNickname(membersMap, targetId);



        if (deerData.length === 0) {

            e.reply(`已添加 ${targetName}，你可以帮 ta 🦌或救活 ta`, true);

            return;

        }

        const data = await new FriendsModel(e).getData(deerData, card || nickname);

        const img = await puppeteer.screenshot("friends", data);

        e.reply([

            `${card || nickname} 单向添加了🦌友 ${targetName}\n之后可「帮🦌@${targetName}」代🦌或救活`,

            img,

        ], true);

    }



    async delDeerFriend(e) {

        const user = e.sender;

        const { user_id, nickname, card } = user;

        let targetId = null;



        if (e.at) {

            targetId = e.at;

        } else if (e?.reply_id !== undefined) {

            targetId = (await e.getReply()).user_id;

        } else {

            targetId = e.msg.replace(/绝交(🦌|鹿)友/g, "").trim();

        }



        if (!targetId || !isNumeric(String(targetId))) {

            e.reply("无法获取🦌友信息，请 @ 或引用对方消息", true);

            return;

        }



        const friends = await loadFriends();

        if (!removeFriendTarget(friends, user_id, targetId)) {

            e.reply("🦌友不在名单中！", true);

            return;

        }

        await saveFriends(friends);



        const membersMap = await this.getGroupUserInfo(e);

        const targetName = this.extractDeerNickname(membersMap, targetId);

        const deerData = this.generateDeerData(friends, user_id, membersMap);



        if (deerData.length === 0) {

            e.reply(`已与 ${targetName} 绝交🦌友关系`, true);

            return;

        }

        const data = await new FriendsModel(e).getData(deerData, card || nickname);

        const img = await puppeteer.screenshot("friends", data);

        e.reply([`${card || nickname} 已与 ${targetName} 绝交🦌友`, img], true);

    }



    async myDeerFriend(e) {

        const user = e.sender;

        const { user_id, card, nickname } = user;

        const friends = await loadFriends();

        const targets = getHelpTargets(friends, user_id);



        if (!targets.length) {

            e.reply("你还没有🦌友！发送「添加🦌友@某人」单向添加，之后可帮 ta 🦌或救活", true);

            return;

        }



        const curGroup = e.group || Bot?.pickGroup(e.group_id);

        const membersMap = await curGroup?.getMemberMap();

        const deerData = this.generateDeerData(friends, user_id, membersMap);



        if (deerData.length === 0) {

            e.reply("🦌友都不在本群，换个群看看吧", true);

            return;

        }



        const data = await new FriendsModel(e).getData(deerData, card || nickname, '我可以帮这些🦌友');

        const img = await puppeteer.screenshot("friends", data);

        e.reply(img);

    }

}

