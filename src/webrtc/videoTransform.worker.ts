/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-01-08 20:55:32
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-01-08 21:16:21
 */
// Minimal WebRTC Encoded Transform worker
// This worker simply passes encoded frames through without modification.

self.addEventListener('rtctransform', (event: any) => {
  const transformer = event.transformer
  const reader = transformer.readable.getReader()
  const writer = transformer.writable.getWriter()
  console.log('videoTransform.worker', event)
  const process = async () => {
    try {
      // Pass-through loop: read each encoded frame and write it out unchanged
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        // value is an encoded frame (e.g. RTCEncodedVideoFrame)
        await writer.write(value)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[videoTransform.worker] transform error', err)
    } finally {
      try {
        await writer.close()
      } catch {
        // ignore
      }
    }
  }

  void process()
})
