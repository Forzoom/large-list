import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { isUndef, isPlainObject, binarySearch } from './utils';
import { ListItem, MetaMap } from '../types';

// 在滚动完成后，如何确认当前应该显示的内容，需要一个跳跃表，跳跃表实际上是二分的逻辑，实时使用二分和使用跳跃表有什么区别吗？
// 跳跃表是否是可以无限扩展的?
// 二分查找是否足够快?
// 需要考虑是使用内部scroll的形式，还是让container占据body来scroll
// 当height更新的时候，所有的top进行更新是不可能的
// 大量的new Image是否会导致内存占用
// 因为对于ios来说，视频在没有点击的情况下并不会被触发，但是大量的创建视频元素也并不是一个好的做法

@Component({
    name: 'LargeList',
})
export default class LargeList extends Vue {
    /** 全部数据列表 */
    @Prop({ type: Array, default() { return []; } }) public list!: ListItem[];
    /** 未加载条目的默认高度 */
    @Prop({ type: Number, default: 200 }) public defaultItemHeight!: number;
    /** 默认条目之间的间隔 */
    @Prop({ type: Number, default: 10 }) public defaultItemGap!: number;
    /** 预先检测的高度 */
    @Prop({ type: Number, default: 200 }) public preloadHeight!: number;
    /** 高度偏移值 */
    @Prop({ type: Number, default: 0 }) public offsetTop!: number;
    /** 滚动事件 */
    @Prop({ type: [ String, Function ], default: 'scroll' }) public scrollEvent!: 'scroll' | 'none';
    /** 屏幕高度 */
    @Prop({ type: Number }) public screenHeight?: number;
    /** 屏幕位置 */
    @Prop({ type: Number }) public scrollY?: number;
    /** 持久化 */
    @Prop() public persistence!: any;
    /** 加载数据 */
    @Prop() public load!: any;

    /** 存储无限加载所需要使用的原始信息 */
    public metaMap: MetaMap = {};
    /** 开始显示内容 */
    public startIndex = 0;
    /** 结束显示内容 */
    public endIndex = 0;
    /** 容器高度 */
    public containerHeight = 0;
    /** 需要从这个index进行刷新数据 */
    public pendingRefresh = false;

    /** id列表 */
    public get idList() {
        return this.list.map((item) => item.id);
    }
    /** 所展示的条目列表 */
    public get displayList() {
        return this.list.slice(this.startIndex, this.endIndex);
    }
    public get screenHeight2() {
        return this.screenHeight || window.innerHeight;
    }
    public get scrollY2() {
        return this.scrollY || window.scrollY;
    }

    /** 当list发生更新 */
    @Watch('$props.list')
    public onListChange(val: ListItem[], oldVal: ListItem[]) {
        const defaultHeight = this.defaultItemHeight + this.defaultItemGap;
        let containerHeight = this.containerHeight;

        // 删除所有的高度，重新添加高度
        for (const item of oldVal) {
            containerHeight -= this.metaMap[item.id].height;
        }

        // 需要处理之前没有的数据
        for (let i = 0, len = val.length; i < len; i++) {
            const id = this.idList[i];
            if (isUndef(this.metaMap[id])) {
                const prevId = this.idList[i - 1];
                let top = 0;
                if (this.metaMap[prevId]) {
                    top = this.metaMap[prevId].top + this.metaMap[prevId].height;
                }
                // 为metaMap设置数据
                Vue.set(this.metaMap, '' + id, {
                    top,
                    height: defaultHeight,
                });
            }
        }

        // 添加高度
        for (const item of val) {
            containerHeight += this.metaMap[item.id].height;
        }
        this.containerHeight = containerHeight;

        // 用于更新startIndex和endIndex
        const $el = this.$el as HTMLElement;
        this.refresh(this.scrollY2 - ($el ? ($el.offsetTop + this.offsetTop) : 0));
    }

    /** 当index发生更新 */
    @Watch('endIndex')
    public onEndIndexChange(newEnd: number, oldEnd: number) {
        if (!this.pendingRefresh) {
            return;
        }
        // 更新所有还没显示的元素的top，当超过10个时，不再处理
        // 这样处理的意义目前不是特别明显，而且这个8应该是可以配置的
        for (let i = oldEnd, len = Math.min(oldEnd + 8, this.idList.length); i < len; i++) {
            const prevId = this.idList[i - 1];
            if (isUndef(prevId)) {
                continue;
            }
            // 需要更新的内容，主要是top
            const id = this.idList[i];
            this.metaMap[id].top = this.metaMap[prevId].top + this.metaMap[prevId].height;
        }
    }

    /**
     * 滚动监听
     */
    public scrollCallback() {
        const $el = this.$el as HTMLElement;
        this.refresh(this.scrollY2 - ($el ? ($el.offsetTop + this.offsetTop) : 0));
    }
    /**
     * 刷新数据
     */
    public refresh(top: number) {
        const bottom = top + this.screenHeight2 + this.preloadHeight;
        top -= this.preloadHeight;
        const list = this.idList;
        this.startIndex = (top < 0 || list.length === 0) ? 0 : binarySearch(top, list, this.metaMap);
        this.endIndex = (bottom < 0 || list.length === 0) ? 0 : binarySearch(bottom, list, this.metaMap) + 1;
    }
    /**
     * 图片加载完成
     */
    public onHeightChange(newHeight: number, id: number) {
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

    public created() {
        let data: any = null;
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

        if (this.scrollEvent === 'scroll') {
            window.addEventListener('scroll', this.scrollCallback);
        }
    }
    public mounted() {
        // 完成首次刷新
        this.$nextTick(() => {
            this.scrollCallback();
        });
    }
    public beforeDestroy() {
        if (this.scrollEvent === 'scroll') {
            window.removeEventListener('scroll', this.scrollCallback);
        }

        // 完成持久化过程
        if (this.persistence) {
            this.persistence({
                metaMap: this.metaMap,
                startIndex: this.startIndex,
                endIndex: this.endIndex,
                containerHeight: this.containerHeight,
            });
        }
    }

    public render(h: typeof Vue.prototype.$createElement) {
        const $default = this.$scopedSlots.default;
        const displayList = $default ? $default({
            startIndex: this.startIndex,
            endIndex: this.endIndex,
        }) : [];
        (displayList || []).forEach((vnode) => {
            const instance = vnode.componentInstance;
            const options = vnode.componentOptions;
            // 1. 有instance就一定有options
            // 依赖于未公开的instance._events，并不是一件好事
            if (instance) {
                // @ts-ignore
                if (!instance._events.heightChange) {
                    instance.$on('heightChange', this.onHeightChange);
                }
            } else if (options) {
                if (options.listeners) {
                    // @ts-ignore
                    options.listeners.heightChange = this.onHeightChange;
                } else {
                    options.listeners = {
                        heightChange: this.onHeightChange,
                    };
                }
            } else {
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
                const id = vnode.componentOptions!.propsData!.id;
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
                    // @ts-ignore
                    vnode.elm.style.top = top;
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
}
