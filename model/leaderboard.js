import Base from './base.js'

export default class Leaderboard extends Base {
    constructor (e) {
        super(e)
        this.model = 'leaderboard'
    }

    async getData (rankData, options = {}) {
        const {
            title = '鹿管排行榜',
            scope = 'month',
            year = new Date().getFullYear(),
            month = new Date().getMonth() + 1,
            isWithdrawal = false,
            totalCount = 0,
        } = options;
        return {
            ...this.screenData,
            saveId: `leaderboard-${scope}-${year}-${month}`,
            rankData,
            title,
            scope,
            year,
            month,
            isWithdrawal,
            totalCount,
            rankCount: rankData.length,
            rankFooter: options.rankFooter || 'yunzai-plugin-deer-pipe · 上榜合计为净值之和',
            sumUnit: options.sumUnit || '次',
        }
    }
}
