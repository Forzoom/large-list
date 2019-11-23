declare namespace LargeList {
    interface TopMap {
        [id: number]: number;
    }
    interface MetaMap {
        [id: number]: {
            height: number; // 元素高度，可能还没有获取，不会发生变化
        };
    }
    /** 将持久化的数据 */
    interface PersistenceData {
        topMap: TopMap;
        metaMap: MetaMap;
        startIndex: number;
        endIndex: number;
        containerHeight: number;
    }
    interface ListItem {
        id: number;
    }
}