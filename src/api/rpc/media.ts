/*
 * @Author: Lei Zhang daisy_zlei@163.com
 * @Date: 2026-06-30 16:26:43
 * @LastEditors: Lei Zhang daisy_zlei@163.com
 * @LastEditTime: 2026-07-02 23:00:31
 */
export interface VirtualMediaItem {
  name: string
  url: string
  iconKey?: string
  description?: string
  descriptionKey?: string
}

export interface VirtualMediaListResponse {
  list: VirtualMediaItem[]
}

export type AddVirtualMediaItemParams = VirtualMediaItem

export type RemoveVirtualMediaItemParams = Pick<VirtualMediaItem, 'name'>

export interface UpdateVirtualMediaListParams {
  list: VirtualMediaItem[]
}
