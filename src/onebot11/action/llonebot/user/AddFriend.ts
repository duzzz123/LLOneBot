import { BaseAction, Schema } from '../../BaseAction'
import { ActionName } from '../../types'

interface Payload {
  user_id: number | string
  comment?: string
  source_id?: number
  group_id?: number | string
}

export class AddFriend extends BaseAction<Payload, null> {
  actionName = ActionName.AddFriend

  payloadSchema = Schema.object({
    user_id: Schema.union([Number, String]).required(),
    comment: Schema.string().default(''),
    source_id: Schema.number().default(0),
    group_id: Schema.union([Number, String])
  })

  protected async _handle(payload: Payload) {
    const uin = payload.user_id.toString()
    const uid = await this.ctx.ntUserApi.getUidByUin(uin)
    if (!uid) throw new Error('无法获取用户信息')

    const res = await this.ctx.ntFriendApi.addBuddy({
      friendUid: uid,
      reqMsg: payload.comment ?? '',
      sourceId: payload.source_id ?? 0,
      groupCode: payload.group_id?.toString()
    })

    if (!res || typeof res.result !== 'number') {
      throw new Error('添加好友调用失败')
    }

    if (res.result !== 0) {
      throw new Error(res.errMsg || '添加好友失败')
    }

    return null
  }
}

