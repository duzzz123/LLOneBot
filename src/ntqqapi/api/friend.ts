import { CategoryFriend, SimpleInfo } from '../types'
import { invoke, NTMethod } from '../ntcall'
import { Context, Service } from 'cordis'

declare module 'cordis' {
  interface Context {
    ntFriendApi: NTQQFriendApi
  }
}

export class NTQQFriendApi extends Service {
  static inject = ['ntUserApi']

  constructor(protected ctx: Context) {
    super(ctx, 'ntFriendApi', true)
  }

  async addBuddy(addInfo: {
    friendUid: string
    reqMsg?: string
    sourceId?: number
    groupCode?: string
    addFrom?: number
  }) {
    const payload = {
      friendUid: addInfo.friendUid,
      reqMsg: addInfo.reqMsg ?? '',
      sourceId: addInfo.sourceId ?? 0,
      groupCode: addInfo.groupCode ?? '0',
      addFrom: addInfo.addFrom ?? 0,
    }

    const methodCandidates = [
      'addBuddy',
      'requestAddBuddy',
      'addBuddySimple',
    ] as const

    let lastMissingMethodError: unknown

    for (const method of methodCandidates) {
      try {
        return await invoke(`nodeIKernelBuddyService/${method}`, [payload])
      }
      catch (err) {
        const isMissingMethod = err instanceof TypeError && /is not a function/.test(err.message)

        if (!isMissingMethod) throw err

        lastMissingMethodError = err
      }
    }

    if (lastMissingMethodError instanceof Error) {
      throw new Error(`调用好友添加接口失败，所有候选方法不可用：${lastMissingMethodError.message}`)
    }

    throw new Error('调用好友添加接口失败，所有候选方法不可用')
  }

  async handleFriendRequest(friendUid: string, reqTime: string, accept: boolean) {
    return await invoke(NTMethod.HANDLE_FRIEND_REQUEST, [{
      friendUid,
      reqTime,
      accept,
    },
    ])
  }

  async getBuddyList(): Promise<SimpleInfo[]> {
    const data = await invoke<SimpleInfo[]>(
      'getBuddyList',
      [],
      {},
    )
    return data
  }

  async getBuddyV2(forceRefresh: boolean) {
    return await invoke('nodeIKernelBuddyService/getBuddyListV2', [forceRefresh, 0])
  }

  async isBuddy(uid: string): Promise<boolean> {
    return await invoke('nodeIKernelBuddyService/isBuddy', [uid])
  }

  async getBuddyRecommendContact(uin: string) {
    const ret = await invoke('nodeIKernelBuddyService/getBuddyRecommendContactArkJson', [uin, '-'])
    return ret.arkMsg
  }

  async setBuddyRemark(uid: string, remark = '') {
    return await invoke('nodeIKernelBuddyService/setBuddyRemark', [
      { uid, remark },
    ])
  }

  async delBuddy(friendUid: string) {
    return await invoke('nodeIKernelBuddyService/delBuddy', [{
      friendUid,
      tempBlock: false,
      tempBothDel: true,
    }])
  }

  async setBuddyCategory(uid: string, categoryId: number) {
    return await invoke('nodeIKernelBuddyService/setBuddyCategory', [uid, categoryId])
  }

  async clearBuddyReqUnreadCnt() {
    return await invoke('nodeIKernelBuddyService/clearBuddyReqUnreadCnt', [])
  }

  async getDoubtBuddyReq(reqNum: number) {
    const reqId = Date.now().toString()
    return await invoke(
      'nodeIKernelBuddyService/getDoubtBuddyReq',
      [reqId, reqNum, ''],
      {
        resultCmd: 'nodeIKernelBuddyListener/onDoubtBuddyReqChange',
        resultCb: payload => payload.reqId === reqId
      }
    )
  }

  async approvalDoubtBuddyReq(uid: string) {
    return await invoke('nodeIKernelBuddyService/approvalDoubtBuddyReq', [uid, '', ''])
  }
}
