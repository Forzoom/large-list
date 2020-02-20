import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { isUndef, isPlainObject } from './utils';

export default {
    name: "LargeList",

    props: {
        /** 全部数据列表 */
        list: { type: Array, default() { return []; } },

        /** 未加载条目的默认高度 */
        defaultItemHeight: { type: Number, default: 200 },

        /** 默认条目之间的间隔 */
        defaultItemGap: { type: Number, default: 10 },

        /** 预先检测的高度 */
        preloadHeight: { type: Number, default: 200 },

        /** 持久化 */
        persistence: {},

        /** 加载数据 */
        load: {}
    },

    data: function data() {
        return {
            /** 存储无限加载所需要使用的原始信息 */
            metaMap: {},

            /** 开始显示内容 */
            startIndex: 0,

            /** 结束显示内容 */
            endIndex: 0,

            /** 容器高度 */
            containerHeight: 0,

            /** 需要从这个index进行刷新数据 */
            pendingRefresh: false
        };
    },

    computed: {
        /** id列表 */
        idList: function() {
            return this.list.map((item) => item.id);
        },

        /** 所展示的条目列表 */
        displayList: function() {
            return this.list.slice(this.startIndex, this.endIndex);
        }
    },

    watch: {
        /** 当list发生更新 */
        "$props.list": function(val) {
            const height = this.defaultItemHeight + this.defaultItemGap;
            // 需要处理之前没有的数据
            for (let i = 0, len = val.length; i < len; i++) {
                const id = this.idList[i];
                if (isUndef(this.metaMap[id])) {
                    const prevId = this.idList[i - 1];
                    if (!prevId) {
                        continue;
                    }
                    Vue.set(this.metaMap, '' + id, {
                        top: this.metaMap[prevId].top + this.metaMap[prevId].height,
                        height,
                    });
                    this.containerHeight += height;
                }
            }
        },

        /** 当index发生更新 */
        endIndex: function(newEnd, oldEnd) {
            if (!this.pendingRefresh) {
                return;
            }
            // 更新所有还没显示的元素的top，当超过10个时，不再处理
            // 这样处理的意义目前不是特别明显，而且这个8应该是可以配置的
            for (let i = oldEnd, len = Math.min(oldEnd + 8, this.idList.length); i < len; i++) {
                const prevId = this.idList[i - 1];
                if (!prevId) {
                    continue;
                }
                // 需要更新的内容，主要是top
                const id = this.idList[i];
                this.metaMap[id].top = this.metaMap[prevId].top + this.metaMap[prevId].height;
            }
        }
    },

    methods: {
        /**
         * 滚动监听
         */
        scrollCallback: function() {
            const $el = this.$el;
            this.refresh(window.scrollY - ($el ? $el.offsetTop : 0));
        },

        /**
         * 刷新数据
         */
        refresh: function(top) {
            const bottom = top + window.innerHeight + this.preloadHeight;
            top -= this.preloadHeight;
            this.startIndex = top < 0 ? 0 : this.binarySearch(top);
            this.endIndex = bottom < 0 ? 0 : this.binarySearch(bottom) + 1;
        },

        /**
         * 二分搜索
         */
        binarySearch: function(targetTop) {
            const finalId = this.idList[this.idList.length - 1];
            if (targetTop > this.metaMap[finalId].top) {
                return this.idList.length - 1;
            }
            let start = 0; // 前方下标
            let end = this.idList.length - 1; // 后方下标
            let pivot = Math.floor((start + end) / 2);
            while (start + 1 < end) {
                const id = this.idList[pivot];
                const pivotTop = this.metaMap[id].top;

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
        },

        /**
         * 图片加载完成
         */
        onHeightChange: function(newHeight, id) {
            const oldHeight = this.metaMap[id].height;
            const height = this.metaMap[id].height = newHeight + this.defaultItemGap;
            this.containerHeight += (height - oldHeight);
            let transform = false;
            for (const item of this.displayList) {
                if (item.id === id) {
                    transform = true;
                    continue;
                }

                // 对接下来的所有元素进行更新
                if (transform) {
                    this.metaMap[item.id].top += (height - oldHeight);
                }
            }

            this.pendingRefresh = true;
        }
    },

    created: function() {
        let data = null;
        if (this.load && (data = this.load())) {
            // 如果存在持久化数据情况下
            this.metaMap = data.metaMap;
            this.containerHeight = data.containerHeight;
            this.startIndex = data.startIndex;
            this.endIndex = data.endIndex;
        } else {
            // 如果不存在持久化数据
            // 向metaMap中加入数据
            let containerHeight = 0;
            for (let i = 0, len = this.idList.length; i < len; i++) {
                const id = '' + this.idList[i];
                const height = this.defaultItemHeight + this.defaultItemGap;
                Vue.set(this.metaMap, id, {
                    top: i * height,
                    height,
                });
                containerHeight += height;
            }
            this.containerHeight = containerHeight;
        }

        window.addEventListener('scroll', this.scrollCallback);
    },

    mounted: function() {
        // 完成首次刷新
        this.$nextTick(() => {
            this.scrollCallback();
        });
    },

    beforeDestroy: function() {
        window.removeEventListener('scroll', this.scrollCallback);
        // 完成持久化过程
        if (this.persistence) {
            this.persistence({
                metaMap: this.metaMap,
                startIndex: this.startIndex,
                endIndex: this.endIndex,
                containerHeight: this.containerHeight,
            });
        }
    },

    render: function(h) {
        const $default = this.$scopedSlots.default;
        const displayList = $default ? $default({
            startIndex: this.startIndex,
            endIndex: this.endIndex,
        }) : [];
        (displayList || []).forEach((vnode) => {
            const instance = vnode.componentInstance;
            const options = vnode.componentOptions;
            // 依赖于未公开的instance._events，并不是一件好事
            // @ts-ignore
            if (instance && !instance._events.heightChange) {
                instance.$on('heightChange', this.onHeightChange);
            } else if (options) {
                if (options.listeners) {
                    // @ts-ignore
                    options.listeners.heightChange = this.onHeightChange;
                } else {
                    options.listeners = {
                        heightChange: this.onHeightChange,
                    };
                }
            } else if (!instance) {
                if (vnode.data) {
                    if (vnode.data.on) {
                        vnode.data.on.heightChange = this.onHeightChange;
                    } else {
                        vnode.data.on = {
                            heightChange: this.onHeightChange,
                        };
                    }
                }
            }
            // 没有data的话，可能哪里存在问题
            if (vnode.data) {
                const style = vnode.data.style;
                // @ts-ignore
                const id = vnode.componentOptions.propsData.id;
                const top = this.metaMap[id].top + 'px';
                if (!style) {
                    vnode.data.style = {
                        top,
                    };
                } else if (typeof style === 'string') {
                    vnode.data.style = style + `; top: ${top}`;
                } else if (isPlainObject(style)) {
                    // @ts-ignore
                    vnode.data.style.top = top;
                }
            }
        });

        return h('div', {
            class: 'large-list',
            style: {
                height: this.containerHeight + 'px',
            },
        }, displayList);
    }
};