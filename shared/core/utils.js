export const sleep = ms => new Promise((resolve) => setTimeout(resolve, ms));
export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
export const lerp = (a, b, t) => a + (b - a) * t;
export const shuffle = (array) => array.sort(() => Math.random() - 0.5);
export const arraysAreEqual = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((val, index) => val === b[index])
export const compressAngle = angle => (angle + 180) / 360 * 255
export const decompressAngle = angle => angle / 255 * 360 - 180
// angle should be -180 to 180. east is 0, southeast 1, south 2, southwest 3, etc
export const angleTo8Direction = angle => Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8
export const angleTo4Direction = angle => Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 90) % 4 * 2 // * 2 to match 'directions' enum
export const rgbToHex = (r, g, b) => "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)
// @ts-ignore
Array.prototype.sample = function () {
    return this[Math.floor(Math.random() * this.length)]
}