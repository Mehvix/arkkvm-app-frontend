export type InputMethodParamsMap = {
  keyboardReport: { keys: number[]; modifier: number }
  relMouseReport: { dx: number; dy: number; buttons: number }
  absMouseReport: { x: number; y: number; buttons: number }
  wheelReport: { wheelY: number }
}

export type InputMethodName = keyof InputMethodParamsMap

export type InputSend<M extends InputMethodName = InputMethodName> =
  M extends InputMethodName ? { method: M; params: InputMethodParamsMap[M] } : never;

enum InputMethodCode {
  KEYBOARD_REPORT = 1,
  REL_MOUSE_REPORT = 2,
  ABS_MOUSE_REPORT = 3,
  WHEEL_REPORT = 4,
}

const METHOD_TO_CODE: Record<InputMethodName, InputMethodCode> = {
  keyboardReport: InputMethodCode.KEYBOARD_REPORT,
  relMouseReport: InputMethodCode.REL_MOUSE_REPORT,
  absMouseReport: InputMethodCode.ABS_MOUSE_REPORT,
  wheelReport: InputMethodCode.WHEEL_REPORT,
};

const toUint32 = (value: number): number => {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value) >>> 0;
};

const toInt32 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.trunc(value) | 0;
};

const zigzag32 = (value: number): number => ((value << 1) ^ (value >> 31)) >>> 0;

const encodeVarint = (value: number): number[] => {
  let n = value >>> 0;
  const out: number[] = [];

  while (n > 0x7f) {
    out.push((n & 0x7f) | 0x80);
    n >>>= 7;
  }

  out.push(n);
  return out;
};

const fieldTag = (fieldNumber: number, wireType: number): number =>
  ((fieldNumber << 3) | wireType) >>> 0;

const pushVarintField = (
  out: number[],
  fieldNumber: number,
  value: number,
  signed = false
): void => {
  out.push(...encodeVarint(fieldTag(fieldNumber, 0)));
  out.push(...encodeVarint(signed ? zigzag32(toInt32(value)) : toUint32(value)));
};

const pushBytesField = (out: number[], fieldNumber: number, bytes: number[]): void => {
  out.push(...encodeVarint(fieldTag(fieldNumber, 2)));
  out.push(...encodeVarint(bytes.length));
  out.push(...bytes);
};

const encodeKeyboardReport = (
  report: InputMethodParamsMap['keyboardReport']
): number[] => {
  const msg: number[] = [];
  const packedKeys: number[] = [];

  for (const key of report.keys) {
    packedKeys.push(...encodeVarint(toUint32(key)));
  }

  if (packedKeys.length > 0) {
    pushBytesField(msg, 1, packedKeys);
  }

  pushVarintField(msg, 2, report.modifier);
  return msg;
};

const encodeRelMouseReport = (
  report: InputMethodParamsMap['relMouseReport']
): number[] => {
  const msg: number[] = [];
  pushVarintField(msg, 1, report.dx, true);
  pushVarintField(msg, 2, report.dy, true);
  pushVarintField(msg, 3, report.buttons);
  return msg;
};

const encodeAbsMouseReport = (
  report: InputMethodParamsMap['absMouseReport']
): number[] => {
  const msg: number[] = [];
  pushVarintField(msg, 1, report.x);
  pushVarintField(msg, 2, report.y);
  pushVarintField(msg, 3, report.buttons);
  return msg;
};

const encodeWheelReport = (report: InputMethodParamsMap['wheelReport']): number[] => {
  const msg: number[] = [];
  pushVarintField(msg, 1, report.wheelY, true);
  return msg;
};

const payloadFieldByMethod: Record<InputMethodName, number> = {
  keyboardReport: 10,
  relMouseReport: 11,
  absMouseReport: 12,
  wheelReport: 13,
};

const encodePayload = (call: InputSend): number[] => {
  switch (call.method) {
    case 'keyboardReport':
      return encodeKeyboardReport(call.params);
    case 'relMouseReport':
      return encodeRelMouseReport(call.params);
    case 'absMouseReport':
      return encodeAbsMouseReport(call.params);
    case 'wheelReport':
      return encodeWheelReport(call.params);
    default:
      return [];
  }
};

export const encodeInputFrame = (call: InputSend, id: number): Uint8Array => {
  const out: number[] = [];
  pushVarintField(out, 1, id);
  pushVarintField(out, 2, METHOD_TO_CODE[call.method]);

  const payload = encodePayload(call);
  pushBytesField(out, payloadFieldByMethod[call.method], payload);

  return Uint8Array.from(out);
};
