/*
 * @Author: Lei Zhang
 * @Date: 2026-06-29 22:03:40
 * @LastEditors: Lei Zhang
 * @LastEditTime: 2026-06-30 23:11:21
 * @FilePath: /git-arkkvm-app-frontend/src/stores/slices/virtualMediaSlice.ts
 */
import type { StateCreator } from 'zustand';
import type { RootState } from '../types';

export type StoredImageItem = {
  name: string
  url: string
  iconKey?: string
  description?: string
  descriptionKey?: string
}

export type VirtualMediaSlice = {
  virtualMedia: {
    customImages: StoredImageItem[]
    setCustomImages: (items: StoredImageItem[]) => void
    addCustomImage: (item: StoredImageItem) => void
    upsertCustomImage: (oldUrl: string, newItem: StoredImageItem) => void
    updateCustomImage: (oldUrl: string, newItem: StoredImageItem) => void
    removeCustomImage: (url: string) => void
  }
}

export const createVirtualMediaSlice: StateCreator<
  RootState,
  [],
  [],
  VirtualMediaSlice
> = set => ({
  virtualMedia: {
    customImages: [],

    setCustomImages: items =>
      set(state => ({
        virtualMedia: { ...state.virtualMedia, customImages: items },
      })),

    addCustomImage: item =>
      set(state => ({
        virtualMedia: {
          ...state.virtualMedia,
          customImages: [...state.virtualMedia.customImages, item],
        },
      })),

    upsertCustomImage: (oldUrl, newItem) =>
      set(state => {
        const exists = state.virtualMedia.customImages.some(img => img.url === oldUrl);
        const customImages = exists
          ? state.virtualMedia.customImages.map(img => img.url === oldUrl ? newItem : img)
          : [...state.virtualMedia.customImages, newItem];
        return { virtualMedia: { ...state.virtualMedia, customImages } };
      }),

    updateCustomImage: (oldUrl, newItem) =>
      set(state => ({
        virtualMedia: {
          ...state.virtualMedia,
          customImages: state.virtualMedia.customImages.map(img =>
            img.url === oldUrl ? newItem : img
          ),
        },
      })),

    removeCustomImage: url =>
      set(state => ({
        virtualMedia: {
          ...state.virtualMedia,
          customImages: state.virtualMedia.customImages.filter(
            img => img.url !== url
          ),
        },
      })),
  },
});
