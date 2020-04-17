(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('vue')) :
    typeof define === 'function' && define.amd ? define(['vue'], factory) :
    (global = global || self, global.LargeList = factory(global.Vue));
}(this, (function (Vue) { 'use strict';

    Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;

    /**
     * 是否是null或者undefined
     *
     * @param {} v 参数
     *
     * @return {boolean}
     */
    function isUndef(v) {
      return v === null || v === undefined;
    }
    /**
     * 是否是某种类型
     */

    function isType(name) {
      return function (val) {
        return Object.prototype.toString.call(val) === "[object ".concat(name, "]");
      };
    }
    var isPlainObject = isType('Object');
    /**
     * 二分搜索
     */

    function binarySearch(targetTop, list, map) {
      var finalId = list[list.length - 1];

      if (targetTop > map[finalId].top) {
        return list.length - 1;
      }

      var start = 0; // 前方下标

      var end = list.length - 1; // 后方下标

      var pivot = Math.floor((start + end) / 2);

      while (start + 1 < end) {
        var id = list[pivot];
        var pivotTop = map[id].top; // 找到

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

    // 跳跃表是否是可以无限扩展的?
    // 二分查找是否足够快?
    // 需要考虑是使用内部scroll的形式，还是让container占据body来scroll
    // 当height更新的时候，所有的top进行更新是不可能的
    // 大量的new Image是否会导致内存占用
    // 因为对于ios来说，视频在没有点击的情况下并不会被触发，但是大量的创建视频元素也并不是一个好的做法

    var index = {
      name: "LargeList",
      props: {
        /** 全部数据列表 */
        list: {
          type: Array,
          "default": function _default() {
            return [];
          }
        },

        /** 未加载条目的默认高度 */
        defaultItemHeight: {
          type: Number,
          "default": 200
        },

        /** 默认条目之间的间隔 */
        defaultItemGap: {
          type: Number,
          "default": 10
        },

        /** 预先检测的高度 */
        preloadHeight: {
          type: Number,
          "default": 200
        },

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
        idList: function idList() {
          return this.list.map(function (item) {
            return item.id;
          });
        },

        /** 所展示的条目列表 */
        displayList: function displayList() {
          return this.list.slice(this.startIndex, this.endIndex);
        }
      },
      watch: {
        /** 当list发生更新 */
        "$props.list": function $propsList(val) {
          var height = this.defaultItemHeight + this.defaultItemGap; // 需要处理之前没有的数据

          for (var i = 0, len = val.length; i < len; i++) {
            var id = this.idList[i];

            if (isUndef(this.metaMap[id])) {
              var prevId = this.idList[i - 1];

              if (!prevId) {
                continue;
              }

              Vue.set(this.metaMap, '' + id, {
                top: this.metaMap[prevId].top + this.metaMap[prevId].height,
                height: height
              });
              this.containerHeight += height;
            }
          }
        },

        /** 当index发生更新 */
        endIndex: function endIndex(newEnd, oldEnd) {
          if (!this.pendingRefresh) {
            return;
          } // 更新所有还没显示的元素的top，当超过10个时，不再处理
          // 这样处理的意义目前不是特别明显，而且这个8应该是可以配置的


          for (var i = oldEnd, len = Math.min(oldEnd + 8, this.idList.length); i < len; i++) {
            var prevId = this.idList[i - 1];

            if (!prevId) {
              continue;
            } // 需要更新的内容，主要是top


            var id = this.idList[i];
            this.metaMap[id].top = this.metaMap[prevId].top + this.metaMap[prevId].height;
          }
        }
      },
      methods: {
        /**
         * 滚动监听
         */
        scrollCallback: function scrollCallback() {
          var $el = this.$el;
          this.refresh(window.scrollY - ($el ? $el.offsetTop : 0));
        },

        /**
         * 刷新数据
         */
        refresh: function refresh(top) {
          var bottom = top + window.innerHeight + this.preloadHeight;
          top -= this.preloadHeight;
          var list = this.idList;
          this.startIndex = top < 0 || list.length === 0 ? 0 : binarySearch(top, list, this.metaMap);
          this.endIndex = bottom < 0 || list.length === 0 ? 0 : binarySearch(bottom, list, this.metaMap) + 1;
        },

        /**
         * 图片加载完成
         */
        onHeightChange: function onHeightChange(newHeight, id) {
          var oldHeight = this.metaMap[id].height;
          var height = this.metaMap[id].height = newHeight + this.defaultItemGap;
          this.containerHeight += height - oldHeight;
          var transform = false;
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = this.displayList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var item = _step.value;

              if (item.id === id) {
                transform = true;
                continue;
              } // 对接下来的所有元素进行更新


              if (transform) {
                this.metaMap[item.id].top += height - oldHeight;
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator["return"] != null) {
                _iterator["return"]();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          this.pendingRefresh = true;
        }
      },
      created: function created() {
        var data = null;

        if (this.load && (data = this.load())) {
          // 如果存在持久化数据情况下
          this.metaMap = data.metaMap;
          this.containerHeight = data.containerHeight;
          this.startIndex = data.startIndex;
          this.endIndex = data.endIndex;
        } else {
          // 如果不存在持久化数据
          // 向metaMap中加入数据
          var containerHeight = 0;

          for (var i = 0, len = this.idList.length; i < len; i++) {
            var id = '' + this.idList[i];
            var height = this.defaultItemHeight + this.defaultItemGap;
            Vue.set(this.metaMap, id, {
              top: i * height,
              height: height
            });
            containerHeight += height;
          }

          this.containerHeight = containerHeight;
        }

        window.addEventListener('scroll', this.scrollCallback);
      },
      mounted: function mounted() {
        var _this = this;

        // 完成首次刷新
        this.$nextTick(function () {
          _this.scrollCallback();
        });
      },
      beforeDestroy: function beforeDestroy() {
        window.removeEventListener('scroll', this.scrollCallback); // 完成持久化过程

        if (this.persistence) {
          this.persistence({
            metaMap: this.metaMap,
            startIndex: this.startIndex,
            endIndex: this.endIndex,
            containerHeight: this.containerHeight
          });
        }
      },
      render: function render(h) {
        var _this2 = this;

        var $default = this.$scopedSlots["default"];
        var displayList = $default ? $default({
          startIndex: this.startIndex,
          endIndex: this.endIndex
        }) : [];
        (displayList || []).forEach(function (vnode) {
          var instance = vnode.componentInstance;
          var options = vnode.componentOptions; // 依赖于未公开的instance._events，并不是一件好事
          // @ts-ignore

          if (instance) {
            // @ts-ignore
            if (!instance._events.heightChange) {
              instance.$on('heightChange', _this2.onHeightChange);
            }
          } else if (options) {
            if (options.listeners) {
              // @ts-ignore
              options.listeners.heightChange = _this2.onHeightChange;
            } else {
              options.listeners = {
                heightChange: _this2.onHeightChange
              };
            }
          } else {
            if (vnode.data) {
              if (vnode.data.on) {
                vnode.data.on.heightChange = _this2.onHeightChange;
              } else {
                vnode.data.on = {
                  heightChange: _this2.onHeightChange
                };
              }
            }
          } // 没有data的话，可能哪里存在问题


          if (vnode.data) {
            var style = vnode.data.style; // @ts-ignore

            var id = vnode.componentOptions.propsData.id;
            var top = _this2.metaMap[id].top + 'px';

            if (!style) {
              vnode.data.style = {
                top: top
              };
            } else if (typeof style === 'string') {
              vnode.data.style = style + "; top: ".concat(top);
            } else if (isPlainObject(style)) {
              // @ts-ignore
              vnode.data.style.top = top; // @ts-ignore

              vnode.elm.style.top = top;
            }
          }
        });
        return h('div', {
          "class": 'large-list',
          style: {
            height: this.containerHeight + 'px'
          }
        }, displayList);
      }
    };

    return index;

})));
