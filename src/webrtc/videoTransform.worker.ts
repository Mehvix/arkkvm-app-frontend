/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-01-08 20:55:32
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-05-11 17:05:49
 */
// Minimal WebRTC Encoded Transform worker
// This worker simply passes encoded frames through without modification.

interface RTCTransformEvent extends Event {
  transformer: {
    readable: ReadableStream;
    writable: WritableStream;
  };
}

self.addEventListener('rtctransform', (event: Event) => {
  const transformer = (event as RTCTransformEvent).transformer;
  const reader = transformer.readable.getReader();
  const writer = transformer.writable.getWriter();
  const process = async () => {
    try {
      // Pass-through loop: read each encoded frame and write it out unchanged
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        // value is an encoded frame (e.g. RTCEncodedVideoFrame)
        await writer.write(value);
      }
    } catch (err) {

      console.error('[videoTransform.worker] transform error', err);
    } finally {
      try {
        await writer.close();
      } catch {
        // ignore
      }
    }
  };

  void process();
});
