var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { isUndef, isPlainObject } from './utils';
// 在滚动完成后，如何确认当前应该显示的内容，需要一个跳跃表，跳跃表实际上是二分的逻辑，实时使用二分和使用跳跃表有什么区别吗？
// 跳跃表是否是可以无限扩展的?
// 二分查找是否足够快?
// 需要考虑是使用内部scroll的形式，还是让container占据body来scroll
// 当height更新的时候，所有的top进行更新是不可能的
// 大量的new Image是否会导致内存占用
// 因为对于ios来说，视频在没有点击的情况下并不会被触发，但是大量的创建视频元素也并不是一个好的做法
var LargeListComponent = /** @class */ (function (_super) {
    __extends(LargeListComponent, _super);
    function LargeListComponent() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /** 存储无限加载所需要使用的高度信息 */
        _this.topMap = {};
        /** 存储无限加载所需要使用的原始信息 */
        _this.metaMap = {};
        /** 开始显示内容 */
        _this.startIndex = 0;
        /** 结束显示内容 */
        _this.endIndex = 0;
        /** 容器高度 */
        _this.containerHeight = 0;
        /** 需要从这个index进行刷新数据 */
        _this.pendingRefresh = false;
        return _this;
    }
    Object.defineProperty(LargeListComponent.prototype, "idList", {
        /** id列表 */
        get: function () {
            return this.list.map(function (item) { return item.id; });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LargeListComponent.prototype, "displayList", {
        /** 所展示的条目列表 */
        get: function () {
            return this.list.slice(this.startIndex, this.endIndex);
        },
        enumerable: true,
        configurable: true
    });
    /** 当list发生更新 */
    LargeListComponent.prototype.onListChange = function (val) {
        var height = this.defaultItemHeight + this.defaultItemGap;
        // 需要处理之前没有的数据
        for (var i = 0, len = val.length; i < len; i++) {
            var id = this.idList[i];
            if (isUndef(this.topMap[id])) {
                var prevId = this.idList[i - 1];
                if (!prevId) {
                    continue;
                }
                Vue.set(this.topMap, '' + id, this.topMap[prevId] + this.metaMap[prevId].height);
                Vue.set(this.metaMap, '' + id, {
                    height: height,
                });
                this.containerHeight += height;
            }
        }
    };
    /** 当index发生更新 */
    LargeListComponent.prototype.onEndIndexChange = function (newEnd, oldEnd) {
        if (!this.pendingRefresh) {
            return;
        }
        // 更新所有还没显示的元素的top，当超过10个时，不再处理
        // 这样处理的意义目前不是特别明显，而且这个8应该是可以配置的
        for (var i = oldEnd, len = Math.min(oldEnd + 8, this.idList.length); i < len; i++) {
            var prevId = this.idList[i - 1];
            if (!prevId) {
                continue;
            }
            // 需要更新的内容，主要是top
            var id = this.idList[i];
            this.topMap[id] = this.topMap[prevId] + this.metaMap[prevId].height;
        }
    };
    /**
     * 滚动监听
     */
    LargeListComponent.prototype.scrollCallback = function () {
        var $el = this.$el;
        this.refresh(window.scrollY - ($el ? $el.offsetTop : 0));
    };
    /**
     * 刷新数据
     */
    LargeListComponent.prototype.refresh = function (top) {
        this.startIndex = top < 0 ? 0 : this.binarySearch(top).index;
        this.endIndex = (top + window.innerHeight < 0) ? 0 : this.binarySearch(top + window.innerHeight).index + 1;
    };
    /**
     * 二分搜索
     * pivot没有办法达到-1
     */
    LargeListComponent.prototype.binarySearch = function (targetTop) {
        var finalId = this.idList[this.idList.length - 1];
        if (targetTop > this.topMap[finalId]) {
            return {
                id: finalId,
                index: this.idList.length - 1,
            };
        }
        var start = 0; // 前方下标
        var end = this.idList.length - 1; // 后方下标
        var pivot = Math.floor((start + end) / 2);
        while (start + 1 < end) {
            var id = this.idList[pivot];
            var pivotTop = this.topMap[id];
            // 找到
            if (pivotTop === targetTop) {
                return {
                    id: id,
                    index: pivot,
                };
            }
            else if (pivotTop < targetTop) {
                start = pivot;
            }
            else {
                end = pivot;
            }
            pivot = Math.floor((start + end) / 2); // 中间下标
        }
        return {
            id: this.idList[pivot],
            index: pivot,
        };
    };
    /**
     * 图片加载完成
     */
    LargeListComponent.prototype.onHeightChange = function (newHeight, id) {
        var oldHeight = this.metaMap[id].height;
        var height = this.metaMap[id].height = newHeight + this.defaultItemGap;
        this.containerHeight += (height - oldHeight);
        var transform = false;
        for (var _i = 0, _a = this.displayList; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.id === id) {
                transform = true;
                continue;
            }
            // 对接下来的所有元素进行更新
            if (transform) {
                this.topMap[item.id] += (height - oldHeight);
            }
        }
        this.pendingRefresh = true;
    };
    LargeListComponent.prototype.created = function () {
        var data = null;
        if (this.load && (data = this.load())) {
            // 如果存在持久化数据情况下
            this.topMap = data.topMap;
            this.metaMap = data.metaMap;
            this.containerHeight = data.containerHeight;
            this.startIndex = data.startIndex;
            this.endIndex = data.endIndex;
        }
        else {
            // 如果不存在持久化数据
            // 向metaMap中加入数据
            var containerHeight = 0;
            for (var i = 0, len = this.idList.length; i < len; i++) {
                var id = '' + this.idList[i];
                var height = this.defaultItemHeight + this.defaultItemGap;
                Vue.set(this.topMap, id, i * height);
                Vue.set(this.metaMap, id, {
                    height: height,
                });
                containerHeight += height;
            }
            this.containerHeight = containerHeight;
        }
        window.addEventListener('scroll', this.scrollCallback);
    };
    LargeListComponent.prototype.mounted = function () {
        var _this = this;
        // 完成首次刷新
        this.$nextTick(function () {
            _this.scrollCallback();
        });
    };
    LargeListComponent.prototype.beforeDestroy = function () {
        window.removeEventListener('scroll', this.scrollCallback);
        // 完成持久化过程
        if (this.persistence) {
            this.persistence({
                topMap: this.topMap,
                metaMap: this.metaMap,
                startIndex: this.startIndex,
                endIndex: this.endIndex,
                containerHeight: this.containerHeight,
            });
        }
    };
    LargeListComponent.prototype.render = function (h) {
        var _this = this;
        var $default = this.$scopedSlots.default;
        var displayList = $default ? $default({
            startIndex: this.startIndex,
            endIndex: this.endIndex,
        }) : [];
        (displayList || []).forEach(function (vnode) {
            var instance = vnode.componentInstance;
            var options = vnode.componentOptions;
            // 依赖于未公开的instance._events，并不是一件好事
            // @ts-ignore
            if (instance && !instance._events.heightChange) {
                instance.$on('heightChange', _this.onHeightChange);
            }
            else if (options) {
                if (options.listeners) {
                    // @ts-ignore
                    options.listeners.heightChange = _this.onHeightChange;
                }
                else {
                    options.listeners = {
                        heightChange: _this.onHeightChange,
                    };
                }
            }
            else if (!instance) {
                if (vnode.data) {
                    if (vnode.data.on) {
                        vnode.data.on.heightChange = _this.onHeightChange;
                    }
                    else {
                        vnode.data.on = {
                            heightChange: _this.onHeightChange,
                        };
                    }
                }
            }
            // 没有data的话，可能哪里存在问题
            if (vnode.data) {
                var style = vnode.data.style;
                // @ts-ignore
                var id = vnode.componentOptions.propsData.id;
                var top_1 = _this.topMap[id] + 'px';
                if (!style) {
                    vnode.data.style = {
                        top: top_1,
                    };
                }
                else if (typeof style === 'string') {
                    vnode.data.style = style + ("; top: " + top_1);
                }
                else if (isPlainObject(style)) {
                    // @ts-ignore
                    vnode.data.style.top = top_1;
                }
            }
        });
        return h('div', {
            class: 'large-list',
            style: {
                height: this.containerHeight + 'px',
            },
        }, displayList);
    };
    __decorate([
        Prop({ type: Array, default: function () { return []; } })
    ], LargeListComponent.prototype, "list", void 0);
    __decorate([
        Prop({ type: Number, default: 200 })
    ], LargeListComponent.prototype, "defaultItemHeight", void 0);
    __decorate([
        Prop({ type: Number, default: 10 })
    ], LargeListComponent.prototype, "defaultItemGap", void 0);
    __decorate([
        Prop()
    ], LargeListComponent.prototype, "persistence", void 0);
    __decorate([
        Prop()
    ], LargeListComponent.prototype, "load", void 0);
    __decorate([
        Watch('$props.list')
    ], LargeListComponent.prototype, "onListChange", null);
    __decorate([
        Watch('endIndex')
    ], LargeListComponent.prototype, "onEndIndexChange", null);
    LargeListComponent = __decorate([
        Component({
            name: 'LargeList',
        })
    ], LargeListComponent);
    return LargeListComponent;
}(Vue));
export default LargeListComponent;
