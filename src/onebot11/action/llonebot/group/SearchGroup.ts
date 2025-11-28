import { BaseAction, Schema } from '../../BaseAction'
import { ActionName } from '../../types'

interface Payload {
  group_id: number | string
}

interface Response {
  group_id: number
  group_name: string
  member_count: number
  max_member_count: number
  owner_uid: string
  owner_uin: string
  group_memo: string
  remark_name: string
  join_group_auth: string
  is_conf_group: boolean
}

export class SearchGroup extends BaseAction<Payload, Response> {
  actionName = ActionName.SearchGroup

  payloadSchema = Schema.object({
    group_id: Schema.union([Number, String]).required(),
  })

  protected async _handle(payload: Payload): Promise<Response> {
    const groupCode = payload.group_id.toString()
    const info = await this.ctx.ntGroupApi.getGroupAllInfo(groupCode)

    if (!info.groupCode || !info.groupName) {
      throw new Error('获取群信息失败')
    }

    const ownerUin = info.ownerUid ? await this.ctx.ntUserApi.getUinByUid(info.ownerUid) : ''

    return {
      group_id: parseInt(info.groupCode) || 0,
      group_name: info.groupName,
      member_count: info.memberNum,
      max_member_count: info.maxMemberNum,
      owner_uid: info.ownerUid,
      owner_uin: ownerUin,
      group_memo: info.groupMemo,
      remark_name: info.remarkName,
      join_group_auth: info.joinGroupAuth,
      is_conf_group: !!info.isConfGroup,
    }
  }
}

