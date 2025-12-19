'use client'

import * as NProgress from 'nprogress'
import * as React from 'react'

export type NextTopLoaderProps = {
  /**
   * Color for the TopLoader.
   * @default "#29d"
   */
  color?: string
  /**
   * The initial position for the TopLoader in percentage, 0.08 is 8%.
   * @default 0.08
   */
  initialPosition?: number
  /**
   * The increament delay speed in milliseconds.
   * @default 200
   */
  crawlSpeed?: number
  /**
   * The height for the TopLoader in pixels (px).
   * @default 3
   */
  height?: number
  /**
   * Auto increamenting behaviour for the TopLoader.
   * @default true
   */
  crawl?: boolean
  /**
   * To show spinner or not.
   * @default true
   */
  showSpinner?: boolean
  /**
   * Animation settings using easing (a CSS easing string).
   * @default "ease"
   */
  easing?: string
  /**
   * Animation speed in ms for the TopLoader.
   * @default 200
   */
  speed?: number
  /**
   * Defines a shadow for the TopLoader.
   * @default "0 0 10px ${color},0 0 5px ${color}"
   *
   * @ you can disable it by setting it to `false`
   */
  shadow?: string | false
  /**
   * Defines a template for the TopLoader.
   * @default "<div class="bar" role="bar"><div class="peg"></div></div>
   * <div class="spinner" role="spinner"><div class="spinner-icon"></div></div>"
   */
  template?: string
  /**
   * Defines zIndex for the TopLoader.
   * @default 1600
   *
   */
  zIndex?: number
  /**
   * To show the TopLoader at bottom.
   * @default false
   *
   */
  showAtBottom?: boolean
  /**
   * To show the TopLoader for hash anchors.
   * @default true
   *
   */
  showForHashAnchor?: boolean
}

const NextTopLoader = ({
  color: propColor,
  height: propHeight,
  showSpinner,
  crawl,
  crawlSpeed,
  initialPosition,
  easing,
  speed,
  shadow,
  template,
  zIndex = 1600,
  showAtBottom = false,
  showForHashAnchor = true
}: NextTopLoaderProps): React.JSX.Element => {
  // 定义默认颜色为蓝色
  const defaultColor = '#29d'
  // 定义默认高度为3像素
  const defaultHeight = 3

  // 使用提供的颜色或默认颜色
  const color = propColor ?? defaultColor
  // 使用提供的高度或默认高度
  const height = propHeight ?? defaultHeight

  // 处理阴影效果
  // 如果shadow是false，则不显示阴影
  // 如果提供了自定义shadow，则使用自定义值
  // 否则使用默认阴影效果
  const boxShadow =
    !shadow && shadow !== undefined
      ? ''
      : shadow
        ? `box-shadow:${shadow}`
        : `box-shadow:0 0 10px ${color},0 0 5px ${color}`

  // 确定进度条的位置样式，默认在顶部，可选择在底部
  const positionStyle = showAtBottom ? 'bottom: 0;' : 'top: 0;'
  // 确定加载旋转图标的位置样式
  const spinnerPositionStyle = showAtBottom ? 'bottom: 15px;' : 'top: 15px;'

  /**
   * 为NextTopLoader定义CSS样式
   */
  const styles = (
    <style>
      {`#nprogress{pointer-events:none}#nprogress .bar{background:${color};position:fixed;z-index:${zIndex};${positionStyle}left:0;width:100%;height:${height}px}#nprogress .peg{display:block;position:absolute;right:0;width:100px;height:100%;${boxShadow};opacity:1;-webkit-transform:rotate(3deg) translate(0px,-4px);-ms-transform:rotate(3deg) translate(0px,-4px);transform:rotate(3deg) translate(0px,-4px)}#nprogress .spinner{display:block;position:fixed;z-index:${zIndex};${spinnerPositionStyle}right:15px}#nprogress .spinner-icon{width:18px;height:18px;box-sizing:border-box;border:2px solid transparent;border-top-color:${color};border-left-color:${color};border-radius:50%;-webkit-animation:nprogress-spinner 400ms linear infinite;animation:nprogress-spinner 400ms linear infinite}.nprogress-custom-parent{overflow:hidden;position:relative}.nprogress-custom-parent #nprogress .bar,.nprogress-custom-parent #nprogress .spinner{position:absolute}@-webkit-keyframes nprogress-spinner{0%{-webkit-trans`}
    </style>
  )

  /**
   * 将相对URL转换为绝对URL
   * @param url {string} 需要转换的URL
   * @returns {string} 转换后的绝对URL
   */
  const toAbsoluteURL = (url: string): string => {
    return new URL(url, window.location.href).href
  }

  /**
   * 检查URL是否为哈希锚点或同页面锚点
   * @param currentUrl {string} 当前URL位置
   * @param newUrl {string} 带有锚点的新URL
   * @returns {boolean} 是否为哈希锚点
   */
  const isHashAnchor = (currentUrl: string, newUrl: string): boolean => {
    const current = new URL(toAbsoluteURL(currentUrl))
    const next = new URL(toAbsoluteURL(newUrl))
    // 比较URL去掉哈希部分后是否相同
    return current.href.split('#')[0] === next.href.split('#')[0]
  }

  /**
   * 检查两个URL是否属于同一主机名
   * @param currentUrl {string} 当前URL位置
   * @param newUrl {string} 新URL
   * @returns {boolean} 是否为同一主机名
   */
  const isSameHostName = (currentUrl: string, newUrl: string): boolean => {
    const current = new URL(toAbsoluteURL(currentUrl))
    const next = new URL(toAbsoluteURL(newUrl))
    // 比较主机名（忽略www前缀）
    return current.hostname.replace(/^www\./, '') === next.hostname.replace(/^www\./, '')
  }

  React.useEffect((): ReturnType<React.EffectCallback> => {
    // 配置NProgress进度条的行为
    NProgress.configure({
      showSpinner: showSpinner ?? true, // 是否显示加载旋转图标
      trickle: crawl ?? true, // 是否启用自动增长
      trickleSpeed: crawlSpeed ?? 200, // 自动增长的速度
      minimum: initialPosition ?? 0.08, // 初始位置（百分比）
      easing: easing ?? 'ease', // 动画缓动函数
      speed: speed ?? 200, // 动画速度
      // HTML模板
      template:
        template ??
        '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
    })

    /**
     * 检查当前URL和新URL是否为同一页面的不同锚点
     * @param currentUrl {string} 当前URL
     * @param newUrl {string} 新URL
     * @returns {boolean} 是否为同一页面的不同锚点
     */
    function isAnchorOfCurrentUrl(currentUrl: string, newUrl: string): boolean {
      const currentUrlObj = new URL(currentUrl)
      const newUrlObj = new URL(newUrl)
      // 比较主机名、路径和搜索参数
      if (
        currentUrlObj.hostname === newUrlObj.hostname &&
        currentUrlObj.pathname === newUrlObj.pathname &&
        currentUrlObj.search === newUrlObj.search
      ) {
        // 检查新URL是否只是当前URL页面的锚点
        const currentHash = currentUrlObj.hash
        const newHash = newUrlObj.hash
        return (
          currentHash !== newHash && currentUrlObj.href.replace(currentHash, '') === newUrlObj.href.replace(newHash, '')
        )
      }
      return false
    }

    // 获取所有HTML元素，用于移除nprogress-busy类
    // deno-lint-ignore no-var
    const nProgressClass: NodeListOf<HTMLHtmlElement> = document.querySelectorAll('html')

    // 移除nprogress-busy类的函数
    const removeNProgressClass = (): void =>
      nProgressClass.forEach((el: Element) => el.classList.remove('nprogress-busy'))

    /**
     * 查找最近的锚点元素
     * @param element {HTMLElement | null} 起始元素
     * @returns {HTMLAnchorElement | null} 找到的锚点元素
     */
    function findClosestAnchor(element: HTMLElement | null): HTMLAnchorElement | null {
      while (element && element.tagName.toLowerCase() !== 'a') {
        element = element.parentElement
      }
      return element as HTMLAnchorElement
    }

    /**
     * 处理点击事件
     * @param event {MouseEvent} 鼠标点击事件
     * @returns {void}
     */
    function handleClick(event: MouseEvent): void {
      try {
        const target = event.target as HTMLElement
        // 查找被点击元素最近的锚点
        const anchor = findClosestAnchor(target)
        const newUrl = anchor?.href
        if (newUrl) {
          const currentUrl = window.location.href
          // 检查是否为外部链接（有target属性）
          const isExternalLink = ((anchor as HTMLAnchorElement).target as React.HTMLAttributeAnchorTarget) !== ''

          // 检查是否为特殊协议链接
          const isSpecialScheme = ['tel:', 'mailto:', 'sms:', 'blob:', 'download:'].some((scheme) =>
            newUrl.startsWith(scheme)
          )

          // 检查是否为不同主机名
          const notSameHost = !isSameHostName(window.location.href, anchor.href)
          if (notSameHost) {
            return
          }

          // 检查是否为锚点或哈希锚点
          const isAnchorOrHashAnchor =
            isAnchorOfCurrentUrl(currentUrl, newUrl) || isHashAnchor(window.location.href, anchor.href)
          if (!showForHashAnchor && isAnchorOrHashAnchor) {
            return
          }

          // 根据不同情况决定是否显示进度条
          if (
            newUrl === currentUrl || // 相同URL
            isExternalLink || // 外部链接
            isSpecialScheme || // 特殊协议
            isAnchorOrHashAnchor || // 锚点链接
            event.ctrlKey || // Ctrl键点击
            event.metaKey || // Meta键点击
            event.shiftKey || // Shift键点击
            event.altKey || // Alt键点击
            !toAbsoluteURL(anchor.href).startsWith('http') // 非HTTP链接
          ) {
            // 对于特殊情况，立即开始并完成进度条
            NProgress.start()
            NProgress.done()
            removeNProgressClass()
          } else {
            // 对于正常导航，开始进度条
            NProgress.start()
          }
        }
      } catch {
        // 捕获错误并确保进度条完成
        // 开发环境可以取消注释下面的日志
        // console.log('NextTopLoader error: ', err);
        NProgress.start()
        NProgress.done()
      }
    }

    /**
     * 监听历史记录pushState方法，在添加新条目到历史堆栈时完成进度条
     * @param {History} 浏览器历史对象
     * @returns {void}
     */
    ;((history: History): void => {
      const pushState = history.pushState
      history.pushState = (...args) => {
        NProgress.done()
        removeNProgressClass()
        return pushState.apply(history, args)
      }
    })((window as Window).history)

    /**
     * 监听历史记录replaceState方法，在替换当前历史条目时完成进度条
     * @param {History} 浏览器历史对象
     * @returns {void}
     */
    ;((history: History): void => {
      const replaceState = history.replaceState
      history.replaceState = (...args) => {
        NProgress.done()
        removeNProgressClass()
        return replaceState.apply(history, args)
      }
    })((window as Window).history)

    /**
     * 处理页面隐藏事件
     * @returns {void}
     */
    function handlePageHide(): void {
      NProgress.done()
      removeNProgressClass()
    }

    /**
     * 处理浏览器前进后退导航
     * @returns {void}
     */
    function handleBackAndForth(): void {
      NProgress.done()
    }

    // 添加全局事件监听器
    window.addEventListener('popstate', handleBackAndForth) // 监听历史记录变化
    document.addEventListener('click', handleClick) // 监听点击事件
    window.addEventListener('pagehide', handlePageHide) // 监听页面隐藏事件

    // 组件卸载时清理全局事件监听器
    return (): void => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('popstate', handleBackAndForth)
    }
    // These event handlers intentionally capture props/state at render time and should not be recreated on every prop change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 返回样式元素
  return styles
}
export default NextTopLoader
