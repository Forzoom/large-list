/**
 * 是否是null或者undefined
 *
 * @param {} v 参数
 *
 * @return {boolean}
 */
export function isUndef(v: any): v is (null | undefined) {
    return v === null || v === undefined;
}

/**
 * 是否是某种类型
 */
export function isType<T>(name: string) {
    return (val: any): val is T => {
        return Object.prototype.toString.call(val) === `[object ${name}]`;
    };
}

export const isPlainObject = isType<object>('Object');
