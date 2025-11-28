import { BaseAction, Schema } from '../../BaseAction'
import { ActionName } from '../../types'

interface Payload {
  group_id?: number | string
  keyword?: number | string
  limit?: number
}

interface GroupInfo {
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

type Response = GroupInfo | { groups: GroupInfo[] }

export class SearchGroup extends BaseAction<Payload, Response> {
  actionName = ActionName.SearchGroup

  payloadSchema = Schema.object({
    group_id: Schema.union([Number, String]),
    keyword: Schema.union([String, Number]),
    limit: Number,
  })

  protected async _handle(payload: Payload): Promise<Response> {
    if (!payload.group_id && !payload.keyword) {
      throw new Error('group_id 与 keyword 至少需要一个')
    }

    if (payload.keyword) {
      const keyword = payload.keyword.toString().trim()
      const groups = await this.ctx.ntGroupApi.searchGroupByKeyword(keyword)
      const limitedGroups = typeof payload.limit === 'number' ? groups.slice(0, payload.limit) : groups

      const ownerUids = limitedGroups
        .map(info => info.groupOwnerId?.memberUid)
        .filter((uid): uid is string => !!uid)

      const ownerUinMap = ownerUids.length ? await this.ctx.ntGroupApi.getUinByUids(ownerUids) : new Map<string, string>()

      const resolveOwnerUin = (uid: string) => {
        if (!uid) return ''
        if (ownerUinMap instanceof Map) return ownerUinMap.get(uid) || ''
        return (ownerUinMap as Record<string, string>)[uid] || ''
      }

      return {
        groups: await Promise.all(
          limitedGroups.map<GroupInfo>(async info => ({
            group_id: Number(info.groupCode) || 0,
            group_name: info.groupName,
            member_count: info.memberCount,
            max_member_count: info.maxMember,
            owner_uid: info.groupOwnerId?.memberUid || '',
            owner_uin: resolveOwnerUin(info.groupOwnerId?.memberUid || ''),
            group_memo: '',
            remark_name: info.remarkName,
            join_group_auth: '',
            is_conf_group: !!info.isConf,
          })),
        ),
      }
    }

    const groupCode = payload.group_id!.toString()
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

