import Vue from 'vue';

export interface TopMap {
    [id: number]: number;
}
export interface MetaMap {
    [id: number]: {
        top: number;
        /** 元素高度，可能还没有获取，不会发生变化 */
        height: number;
    };
}
/** 将持久化的数据 */
export interface PersistenceData {
    topMap: TopMap;
    metaMap: MetaMap;
    startIndex: number;
    endIndex: number;
    containerHeight: number;
}
export interface ListItem {
    id: number;
}

export default Vue;
