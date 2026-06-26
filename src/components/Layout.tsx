/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-10-27 16:25:25
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-03-26 20:48:47
 */
import { useGlobalSettingsStore } from '@/stores';
import React from 'react';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
  children?: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentTheme } = useGlobalSettingsStore();

  return (
    <div className={`flex flex-col min-h-svh h-full ${currentTheme}`}>
      {children || <Outlet />}
    </div>
  );
};
