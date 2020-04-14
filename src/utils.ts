import { MetaMap } from "../types";

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

/**
 * 二分搜索
 */
export function binarySearch(targetTop: number, list: number[], map: MetaMap) {
    const finalId = list[list.length - 1];
    if (targetTop > map[finalId].top) {
        return list.length - 1;
    }
    let start = 0; // 前方下标
    let end = list.length - 1; // 后方下标
    let pivot = Math.floor((start + end) / 2);
    while (start + 1 < end) {
        const id = list[pivot];
        const pivotTop = map[id].top;

        // 找到
        if (pivotTop === targetTop) {
            return pivot;
        } else if (pivotTop < targetTop) {
            start = pivot;
        } else {
            end = pivot;
        }
        pivot = Math.floor((start + end) / 2); // 中间下标
    }
    return pivot;
}
