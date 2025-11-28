import { BuddyListReqType } from '@/ntqqapi/types'
import { GeneralCallResult } from './common'

export interface NodeIKernelBuddyService {
  getBuddyListV2(forceRefresh: boolean, reqType: BuddyListReqType): Promise<GeneralCallResult & {
    data: {
      categoryId: number
      categorySortId: number
      categroyName: string
      categroyMbCount: number
      onlineCount: number
      buddyUids: string[]
    }[]
  }>

  setBuddyRemark(remarkParams: { uid: string, remark: string }): Promise<GeneralCallResult>

  isBuddy(uid: string): boolean

  approvalFriendRequest(approvalInfo: {
    friendUid: string
    reqTime: string
    accept: boolean
  }): Promise<GeneralCallResult>

  addBuddy(addInfo: {
    friendUid: string
    reqMsg?: string
    sourceId?: number
    groupCode?: string
    addFrom?: number
  }): Promise<GeneralCallResult>

  requestAddBuddy?(addInfo: {
    friendUid: string
    reqMsg?: string
    sourceId?: number
    groupCode?: string
    addFrom?: number
  }): Promise<GeneralCallResult>

  addBuddySimple?(addInfo: {
    friendUid: string
    reqMsg?: string
    sourceId?: number
    groupCode?: string
    addFrom?: number
  }): Promise<GeneralCallResult>

  getBuddyRecommendContactArkJson(uid: string, phoneNumber: string): Promise<GeneralCallResult & { arkMsg: string }>

  delBuddy(delInfo: {
    friendUid: string
    tempBlock: boolean
    tempBothDel: boolean
  }): Promise<GeneralCallResult>

  clearBuddyReqUnreadCnt(): Promise<GeneralCallResult>

  setBuddyCategory(uid: string, categoryId: number): Promise<GeneralCallResult>

  getDoubtBuddyReq(reqId: string, reqNum: number, cookie: string): Promise<GeneralCallResult>

  approvalDoubtBuddyReq(uid: string, groupId: string, remark: string): Promise<GeneralCallResult>
}
