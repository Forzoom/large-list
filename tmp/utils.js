/**
 * 是否是null或者undefined
 *
 * @param {} v 参数
 *
 * @return {boolean}
 */
export function isUndef(v) {
    return v === null || v === undefined;
}
/**
 * 是否是某种类型
 */
export function isType(name) {
    return function (val) {
        return Object.prototype.toString.call(val) === "[object " + name + "]";
    };
}
export var isPlainObject = isType('Object');
