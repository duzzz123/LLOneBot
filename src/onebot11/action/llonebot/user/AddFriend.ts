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
    const userId = payload.user_id.toString()
    let uid = ''
    if (/^\d+$/.test(userId)) {
      uid = await this.ctx.ntUserApi.getUidByUin(userId, payload.group_id?.toString())
    } else {
      uid = userId
    }

    if (!uid) throw new Error('无法获取用户信息')

    const sourceId = payload.source_id ?? (payload.group_id ? 203 : 201)

    const res = await this.ctx.ntFriendApi.addBuddy({
      friendUid: uid,
      reqMsg: payload.comment ?? '',
      sourceId,
      groupCode: payload.group_id?.toString() ?? ''
    })

    const resultCode = [res?.result, (res as any)?.ec, (res as any)?.retcode, (res as any)?.ret, (res as any)?.code]
      .find(code => typeof code === 'number' || typeof code === 'string')

    const normalized = typeof resultCode === 'string' ? Number(resultCode) : resultCode

    if (normalized !== undefined && normalized !== null && normalized !== 0) {
      throw new Error(res?.errMsg || (res as any)?.msg || `添加好友失败（code=${normalized})`)
    }

    if (normalized === undefined || normalized === null) {
      throw new Error(`添加好友调用失败${res ? `: ${JSON.stringify(res)}` : ''}`)
    }

    return null
  }
}

