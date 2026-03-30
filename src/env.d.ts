/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-14 15:45:53
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-07-21 19:57:44
 */
/// <reference types="@rsbuild/core/types" />

/**
 * Imports the SVG file as a React component.
 * @requires [@rsbuild/plugin-svgr](https://npmjs.com/package/@rsbuild/plugin-svgr)
 */
declare module '*.svg' {
  import type React from 'react'
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >
  const content: string
  export default content
}

declare module '*.svg?react' {
  import type React from 'react'
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  export default ReactComponent
}
