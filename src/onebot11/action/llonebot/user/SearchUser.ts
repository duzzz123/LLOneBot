import { BaseAction, Schema } from '../../BaseAction'
import { ActionName } from '../../types'
import { calcQQLevel } from '@/common/utils/misc'

interface Payload {
  keyword: number | string
}

interface Response {
  uid: string
  uin: number
  nickname: string
  long_nick: string
  qid: string
  age: number
  sex: number
  level: number
  avatar_url: string
  is_friend: boolean
}

export class SearchUser extends BaseAction<Payload, Response> {
  actionName = ActionName.SearchUser

  payloadSchema = Schema.object({
    keyword: Schema.union([Number, String]).required(),
  })

  protected async _handle(payload: Payload): Promise<Response> {
    const uin = payload.keyword.toString()
    const data = await this.ctx.ntUserApi.getUserDetailInfoByUin(uin)
    if (data.result !== 0) {
      throw new Error(data.errMsg)
    }

    const detail = data.detail
    const simple = detail.simpleInfo
    const level = detail.commonExt?.qqLevel ? calcQQLevel(detail.commonExt.qqLevel) : 0
    const isFriend = detail.uid ? await this.ctx.ntFriendApi.isBuddy(detail.uid) : false

    return {
      uid: detail.uid,
      uin: parseInt(detail.uin) || 0,
      nickname: simple.coreInfo.nick,
      long_nick: simple.baseInfo.longNick,
      qid: simple.baseInfo.qid,
      age: simple.baseInfo.age,
      sex: simple.baseInfo.sex,
      level,
      avatar_url: `https://thirdqq.qlogo.cn/g?b=qq&nk=${detail.uin}&s=640`,
      is_friend: isFriend,
    }
  }
}

