import { BaseAction, Schema } from '../../BaseAction'
import { ActionName } from '../../types'

interface Payload {
  keyword: number | string
}

interface SearchUserItem {
  uid: string
  uin: number
  nickname: string
  remark: string
  qid: string
  avatar_url: string
}

interface SearchGroupItem {
  group_id: number
  group_name: string
  remark_name: string
  member_count: number
  max_member_count: number
  owner_uid: string
  is_conf_group: boolean
}

interface Response {
  users: SearchUserItem[]
  groups: SearchGroupItem[]
}

export class Search extends BaseAction<Payload, Response> {
  actionName = ActionName.Search

  payloadSchema = Schema.object({
    keyword: Schema.union([String, Number]).required(),
  })

  protected async _handle(payload: Payload): Promise<Response> {
    const keyword = payload.keyword.toString().trim().toLowerCase()

    const [buddies, groups] = await Promise.all([
      this.ctx.ntFriendApi.getBuddyList(),
      this.ctx.ntGroupApi.getGroups(),
    ])

    const matchedUsers = buddies
      .filter(info => {
        const haystack = [
          info.coreInfo.nick,
          info.coreInfo.remark,
          info.coreInfo.uin,
          info.baseInfo?.qid,
        ]
          .filter(Boolean)
          .map(value => value.toString().toLowerCase())
        return haystack.some(value => value.includes(keyword))
      })
      .map<SearchUserItem>(info => ({
        uid: info.coreInfo.uid,
        uin: Number(info.coreInfo.uin) || 0,
        nickname: info.coreInfo.nick,
        remark: info.coreInfo.remark,
        qid: info.baseInfo?.qid || '',
        avatar_url: `https://thirdqq.qlogo.cn/g?b=qq&nk=${info.coreInfo.uin}&s=640`,
      }))

    const matchedGroups = groups
      .filter(info => {
        const haystack = [info.groupName, info.remarkName, info.groupCode]
          .filter(Boolean)
          .map(value => value.toString().toLowerCase())
        return haystack.some(value => value.includes(keyword))
      })
      .map<SearchGroupItem>(info => ({
        group_id: Number(info.groupCode) || 0,
        group_name: info.groupName,
        remark_name: info.remarkName,
        member_count: info.memberCount,
        max_member_count: info.maxMember,
        owner_uid: info.groupOwnerId?.memberUid || '',
        is_conf_group: !!info.isConf,
      }))

    return { users: matchedUsers, groups: matchedGroups }
  }
}
