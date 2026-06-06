import Base from './base.js';

export default class FriendsModel extends Base {
    constructor(e) {
        super(e);
        this.model = 'friends';
    }

    async getData(friendsData, myNickName, options = {}) {
        const {
            listTitle = '我的🦌友林',
            friendCount = friendsData?.length ?? 0,
        } = typeof options === 'string'
            ? { listTitle: options }
            : options;

        return {
            ...this.screenData,
            saveId: `friends-${myNickName}-${friendCount}`,
            friendsData,
            myNickName,
            listTitle,
            friendCount,
        };
    }
}
