/**
 * @Author: zhanglei
 * @Date: 2025-07-17 14:04:27
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-03-26 17:29:23
 */
import NotFound from '@/pages/404.page';
import { env } from '@/utils/env';
import { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import RouteAuth from './RouteAuth';
import { CustomRouteObject, routes } from './routeConfig';
const LoadingComponent = () => <div className="route-loading">Loading...</div>;
const renderRoutes = (routes: CustomRouteObject[]) => {
  return routes.map((route, index) => {
    const { element: Element, children, path } = route;

    return (
      <Route
        key={path || index}
        path={path}
        element={
          <Suspense fallback={<LoadingComponent />}>
            <Element />
          </Suspense>
        }
      >
        {children && renderRoutes(children)}
      </Route>
    );
  });
};
const RouterProvider = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RouteAuth />}>
          {renderRoutes(routes)}

          {env.target === 'cloud' && (
            <Route path="/" element={<Navigate to="/devices/list" replace />} />
          )}

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default RouterProvider;
