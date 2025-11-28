import { BaseAction, Schema } from '../../BaseAction'
import { ActionName } from '../../types'

interface Payload {
  group_id: number | string
  comment?: string
  source_id?: number
  inviter_uid?: string
  ticket?: string
}

interface Response {
  group_id: number
  status: 'ok'
}

export class JoinGroup extends BaseAction<Payload, Response> {
  actionName = ActionName.JoinGroup

  payloadSchema = Schema.object({
    group_id: Schema.union([Number, String]).required(),
    comment: String.optional(),
    source_id: Number.optional(),
    inviter_uid: String.optional(),
    ticket: String.optional(),
  })

  protected async _handle(payload: Payload): Promise<Response> {
    const groupCode = payload.group_id.toString()

    const result = await this.ctx.ntGroupApi.joinGroup({
      groupCode,
      reqMsg: payload.comment,
      sourceId: payload.source_id,
      inviterUid: payload.inviter_uid,
      ticket: payload.ticket,
    })

    if (result?.errCode !== 0) {
      throw new Error(result?.errMsg || '加群请求失败')
    }

    return {
      group_id: Number(groupCode) || 0,
      status: 'ok',
    }
  }
}
