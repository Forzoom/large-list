'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Vue = _interopDefault(require('vue'));

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _initializerDefineProperty(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object.keys(descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object.defineProperty(target, property, desc);
    desc = null;
  }

  return desc;
}

/**
  * vue-class-component v7.1.0
  * (c) 2015-present Evan You
  * @license MIT
  */

// The rational behind the verbose Reflect-feature check below is the fact that there are polyfills
// which add an implementation for Reflect.defineMetadata but not for Reflect.getOwnMetadataKeys.
// Without this check consumers will encounter hard to track down runtime errors.
var reflectionIsSupported = typeof Reflect !== 'undefined' && Reflect.defineMetadata && Reflect.getOwnMetadataKeys;
function copyReflectionMetadata(to, from) {
    forwardMetadata(to, from);
    Object.getOwnPropertyNames(from.prototype).forEach(function (key) {
        forwardMetadata(to.prototype, from.prototype, key);
    });
    Object.getOwnPropertyNames(from).forEach(function (key) {
        forwardMetadata(to, from, key);
    });
}
function forwardMetadata(to, from, propertyKey) {
    var metaKeys = propertyKey
        ? Reflect.getOwnMetadataKeys(from, propertyKey)
        : Reflect.getOwnMetadataKeys(from);
    metaKeys.forEach(function (metaKey) {
        var metadata = propertyKey
            ? Reflect.getOwnMetadata(metaKey, from, propertyKey)
            : Reflect.getOwnMetadata(metaKey, from);
        if (propertyKey) {
            Reflect.defineMetadata(metaKey, metadata, to, propertyKey);
        }
        else {
            Reflect.defineMetadata(metaKey, metadata, to);
        }
    });
}

var fakeArray = { __proto__: [] };
var hasProto = fakeArray instanceof Array;
function createDecorator(factory) {
    return function (target, key, index) {
        var Ctor = typeof target === 'function'
            ? target
            : target.constructor;
        if (!Ctor.__decorators__) {
            Ctor.__decorators__ = [];
        }
        if (typeof index !== 'number') {
            index = undefined;
        }
        Ctor.__decorators__.push(function (options) { return factory(options, key, index); });
    };
}
function isPrimitive(value) {
    var type = typeof value;
    return value == null || (type !== 'object' && type !== 'function');
}
function warn(message) {
    if (typeof console !== 'undefined') {
        console.warn('[vue-class-component] ' + message);
    }
}

function collectDataFromConstructor(vm, Component) {
    // override _init to prevent to init as Vue instance
    var originalInit = Component.prototype._init;
    Component.prototype._init = function () {
        var _this = this;
        // proxy to actual vm
        var keys = Object.getOwnPropertyNames(vm);
        // 2.2.0 compat (props are no longer exposed as self properties)
        if (vm.$options.props) {
            for (var key in vm.$options.props) {
                if (!vm.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
        }
        keys.forEach(function (key) {
            if (key.charAt(0) !== '_') {
                Object.defineProperty(_this, key, {
                    get: function () { return vm[key]; },
                    set: function (value) { vm[key] = value; },
                    configurable: true
                });
            }
        });
    };
    // should be acquired class property values
    var data = new Component();
    // restore original _init to avoid memory leak (#209)
    Component.prototype._init = originalInit;
    // create plain data object
    var plainData = {};
    Object.keys(data).forEach(function (key) {
        if (data[key] !== undefined) {
            plainData[key] = data[key];
        }
    });
    if (process.env.NODE_ENV !== 'production') {
        if (!(Component.prototype instanceof Vue) && Object.keys(plainData).length > 0) {
            warn('Component class must inherit Vue or its descendant class ' +
                'when class property is used.');
        }
    }
    return plainData;
}

var $internalHooks = [
    'data',
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeDestroy',
    'destroyed',
    'beforeUpdate',
    'updated',
    'activated',
    'deactivated',
    'render',
    'errorCaptured',
    'serverPrefetch' // 2.6
];
function componentFactory(Component, options) {
    if (options === void 0) { options = {}; }
    options.name = options.name || Component._componentTag || Component.name;
    // prototype props.
    var proto = Component.prototype;
    Object.getOwnPropertyNames(proto).forEach(function (key) {
        if (key === 'constructor') {
            return;
        }
        // hooks
        if ($internalHooks.indexOf(key) > -1) {
            options[key] = proto[key];
            return;
        }
        var descriptor = Object.getOwnPropertyDescriptor(proto, key);
        if (descriptor.value !== void 0) {
            // methods
            if (typeof descriptor.value === 'function') {
                (options.methods || (options.methods = {}))[key] = descriptor.value;
            }
            else {
                // typescript decorated data
                (options.mixins || (options.mixins = [])).push({
                    data: function () {
                        var _a;
                        return _a = {}, _a[key] = descriptor.value, _a;
                    }
                });
            }
        }
        else if (descriptor.get || descriptor.set) {
            // computed properties
            (options.computed || (options.computed = {}))[key] = {
                get: descriptor.get,
                set: descriptor.set
            };
        }
    });
    (options.mixins || (options.mixins = [])).push({
        data: function () {
            return collectDataFromConstructor(this, Component);
        }
    });
    // decorate options
    var decorators = Component.__decorators__;
    if (decorators) {
        decorators.forEach(function (fn) { return fn(options); });
        delete Component.__decorators__;
    }
    // find super
    var superProto = Object.getPrototypeOf(Component.prototype);
    var Super = superProto instanceof Vue
        ? superProto.constructor
        : Vue;
    var Extended = Super.extend(options);
    forwardStaticMembers(Extended, Component, Super);
    if (reflectionIsSupported) {
        copyReflectionMetadata(Extended, Component);
    }
    return Extended;
}
var reservedPropertyNames = [
    // Unique id
    'cid',
    // Super Vue constructor
    'super',
    // Component options that will be used by the component
    'options',
    'superOptions',
    'extendOptions',
    'sealedOptions',
    // Private assets
    'component',
    'directive',
    'filter'
];
var shouldIgnore = {
    prototype: true,
    arguments: true,
    callee: true,
    caller: true
};
function forwardStaticMembers(Extended, Original, Super) {
    // We have to use getOwnPropertyNames since Babel registers methods as non-enumerable
    Object.getOwnPropertyNames(Original).forEach(function (key) {
        // Skip the properties that should not be overwritten
        if (shouldIgnore[key]) {
            return;
        }
        // Some browsers does not allow reconfigure built-in properties
        var extendedDescriptor = Object.getOwnPropertyDescriptor(Extended, key);
        if (extendedDescriptor && !extendedDescriptor.configurable) {
            return;
        }
        var descriptor = Object.getOwnPropertyDescriptor(Original, key);
        // If the user agent does not support `__proto__` or its family (IE <= 10),
        // the sub class properties may be inherited properties from the super class in TypeScript.
        // We need to exclude such properties to prevent to overwrite
        // the component options object which stored on the extended constructor (See #192).
        // If the value is a referenced value (object or function),
        // we can check equality of them and exclude it if they have the same reference.
        // If it is a primitive value, it will be forwarded for safety.
        if (!hasProto) {
            // Only `cid` is explicitly exluded from property forwarding
            // because we cannot detect whether it is a inherited property or not
            // on the no `__proto__` environment even though the property is reserved.
            if (key === 'cid') {
                return;
            }
            var superDescriptor = Object.getOwnPropertyDescriptor(Super, key);
            if (!isPrimitive(descriptor.value) &&
                superDescriptor &&
                superDescriptor.value === descriptor.value) {
                return;
            }
        }
        // Warn if the users manually declare reserved properties
        if (process.env.NODE_ENV !== 'production' &&
            reservedPropertyNames.indexOf(key) >= 0) {
            warn("Static property name '" + key + "' declared on class '" + Original.name + "' " +
                'conflicts with reserved property name of Vue internal. ' +
                'It may cause unexpected behavior of the component. Consider renaming the property.');
        }
        Object.defineProperty(Extended, key, descriptor);
    });
}

function Component(options) {
    if (typeof options === 'function') {
        return componentFactory(options);
    }
    return function (Component) {
        return componentFactory(Component, options);
    };
}
Component.registerHooks = function registerHooks(keys) {
    $internalHooks.push.apply($internalHooks, keys);
};

/** vue-property-decorator verson 8.2.2 MIT LICENSE copyright 2019 kaorun343 */
/** @see {@link https://github.com/vuejs/vue-class-component/blob/master/src/reflect.ts} */
var reflectMetadataIsSupported = typeof Reflect !== 'undefined' && typeof Reflect.getMetadata !== 'undefined';
function applyMetadata(options, target, key) {
    if (reflectMetadataIsSupported) {
        if (!Array.isArray(options) &&
            typeof options !== 'function' &&
            typeof options.type === 'undefined') {
            options.type = Reflect.getMetadata('design:type', target, key);
        }
    }
}
/**
 * decorator of a prop
 * @param  options the options for the prop
 * @return PropertyDecorator | void
 */
function Prop(options) {
    if (options === void 0) { options = {}; }
    return function (target, key) {
        applyMetadata(options, target, key);
        createDecorator(function (componentOptions, k) {
            (componentOptions.props || (componentOptions.props = {}))[k] = options;
        })(target, key);
    };
}
/**
 * decorator of a watch function
 * @param  path the path or the expression to observe
 * @param  WatchOption
 * @return MethodDecorator
 */
function Watch(path, options) {
    if (options === void 0) { options = {}; }
    var _a = options.deep, deep = _a === void 0 ? false : _a, _b = options.immediate, immediate = _b === void 0 ? false : _b;
    return createDecorator(function (componentOptions, handler) {
        if (typeof componentOptions.watch !== 'object') {
            componentOptions.watch = Object.create(null);
        }
        var watch = componentOptions.watch;
        if (typeof watch[path] === 'object' && !Array.isArray(watch[path])) {
            watch[path] = [watch[path]];
        }
        else if (typeof watch[path] === 'undefined') {
            watch[path] = [];
        }
        watch[path].push({ handler: handler, deep: deep, immediate: immediate });
    });
}

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

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _temp;
// 跳跃表是否是可以无限扩展的?
// 二分查找是否足够快?
// 需要考虑是使用内部scroll的形式，还是让container占据body来scroll
// 当height更新的时候，所有的top进行更新是不可能的
// 大量的new Image是否会导致内存占用
// 因为对于ios来说，视频在没有点击的情况下并不会被触发，但是大量的创建视频元素也并不是一个好的做法

var LargeListComponent = (_dec = Component({
  name: 'LargeList'
}), _dec2 = Prop({
  type: Array,
  "default": function _default() {
    return [];
  }
}), _dec3 = Prop({
  type: Number,
  "default": 200
}), _dec4 = Prop({
  type: Number,
  "default": 10
}), _dec5 = Prop(), _dec6 = Prop(), _dec7 = Watch('$props.list'), _dec8 = Watch('endIndex'), _dec(_class = (_class2 = (_temp =
/*#__PURE__*/
function (_Vue) {
  _inherits(LargeListComponent, _Vue);

  function LargeListComponent() {
    var _getPrototypeOf2;

    var _this;

    _classCallCheck(this, LargeListComponent);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(LargeListComponent)).call.apply(_getPrototypeOf2, [this].concat(args)));

    _initializerDefineProperty(_assertThisInitialized(_this), "list", _descriptor, _assertThisInitialized(_this));

    _initializerDefineProperty(_assertThisInitialized(_this), "defaultItemHeight", _descriptor2, _assertThisInitialized(_this));

    _initializerDefineProperty(_assertThisInitialized(_this), "defaultItemGap", _descriptor3, _assertThisInitialized(_this));

    _initializerDefineProperty(_assertThisInitialized(_this), "persistence", _descriptor4, _assertThisInitialized(_this));

    _initializerDefineProperty(_assertThisInitialized(_this), "load", _descriptor5, _assertThisInitialized(_this));

    _defineProperty(_assertThisInitialized(_this), "topMap", {});

    _defineProperty(_assertThisInitialized(_this), "metaMap", {});

    _defineProperty(_assertThisInitialized(_this), "startIndex", 0);

    _defineProperty(_assertThisInitialized(_this), "endIndex", 0);

    _defineProperty(_assertThisInitialized(_this), "containerHeight", 0);

    _defineProperty(_assertThisInitialized(_this), "pendingRefresh", false);

    return _this;
  }

  _createClass(LargeListComponent, [{
    key: "onListChange",

    /** 当list发生更新 */
    value: function onListChange(val) {
      var height = this.defaultItemHeight + this.defaultItemGap; // 需要处理之前没有的数据

      for (var i = 0, len = val.length; i < len; i++) {
        var id = this.idList[i];

        if (isUndef(this.topMap[id])) {
          var prevId = this.idList[i - 1];

          if (!prevId) {
            continue;
          }

          Vue.set(this.topMap, '' + id, this.topMap[prevId] + this.metaMap[prevId].height);
          Vue.set(this.metaMap, '' + id, {
            height: height
          });
          this.containerHeight += height;
        }
      }
    }
    /** 当index发生更新 */

  }, {
    key: "onEndIndexChange",
    value: function onEndIndexChange(newEnd, oldEnd) {
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
        this.topMap[id] = this.topMap[prevId] + this.metaMap[prevId].height;
      }
    }
    /**
     * 滚动监听
     */

  }, {
    key: "scrollCallback",
    value: function scrollCallback() {
      var $el = this.$el;
      this.refresh(window.scrollY - ($el ? $el.offsetTop : 0));
    }
    /**
     * 刷新数据
     */

  }, {
    key: "refresh",
    value: function refresh(top) {
      this.startIndex = top < 0 ? 0 : this.binarySearch(top).index;
      this.endIndex = top + window.innerHeight < 0 ? 0 : this.binarySearch(top + window.innerHeight).index + 1;
    }
    /**
     * 二分搜索
     * pivot没有办法达到-1
     */

  }, {
    key: "binarySearch",
    value: function binarySearch(targetTop) {
      var finalId = this.idList[this.idList.length - 1];

      if (targetTop > this.topMap[finalId]) {
        return {
          id: finalId,
          index: this.idList.length - 1
        };
      }

      var start = 0; // 前方下标

      var end = this.idList.length - 1; // 后方下标

      var pivot = Math.floor((start + end) / 2);

      while (start + 1 < end) {
        var id = this.idList[pivot];
        var pivotTop = this.topMap[id]; // 找到

        if (pivotTop === targetTop) {
          return {
            id: id,
            index: pivot
          };
        } else if (pivotTop < targetTop) {
          start = pivot;
        } else {
          end = pivot;
        }

        pivot = Math.floor((start + end) / 2); // 中间下标
      }

      return {
        id: this.idList[pivot],
        index: pivot
      };
    }
    /**
     * 图片加载完成
     */

  }, {
    key: "onHeightChange",
    value: function onHeightChange(newHeight, id) {
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
            this.topMap[item.id] += height - oldHeight;
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
  }, {
    key: "created",
    value: function created() {
      var data = null;

      if (this.load && (data = this.load())) {
        // 如果存在持久化数据情况下
        this.topMap = data.topMap;
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
          Vue.set(this.topMap, id, i * height);
          Vue.set(this.metaMap, id, {
            height: height
          });
          containerHeight += height;
        }

        this.containerHeight = containerHeight;
      }

      window.addEventListener('scroll', this.scrollCallback);
    }
  }, {
    key: "mounted",
    value: function mounted() {
      var _this2 = this;

      // 完成首次刷新
      this.$nextTick(function () {
        _this2.scrollCallback();
      });
    }
  }, {
    key: "beforeDestroy",
    value: function beforeDestroy() {
      window.removeEventListener('scroll', this.scrollCallback); // 完成持久化过程

      if (this.persistence) {
        this.persistence({
          topMap: this.topMap,
          metaMap: this.metaMap,
          startIndex: this.startIndex,
          endIndex: this.endIndex,
          containerHeight: this.containerHeight
        });
      }
    }
  }, {
    key: "render",
    value: function render(h) {
      var _this3 = this;

      var $default = this.$scopedSlots["default"];
      var displayList = $default ? $default({
        startIndex: this.startIndex,
        endIndex: this.endIndex
      }) : [];
      (displayList || []).forEach(function (vnode) {
        var instance = vnode.componentInstance;
        var options = vnode.componentOptions; // 依赖于未公开的instance._events，并不是一件好事
        // @ts-ignore

        if (instance && !instance._events.heightChange) {
          instance.$on('heightChange', _this3.onHeightChange);
        } else if (options) {
          if (options.listeners) {
            // @ts-ignore
            options.listeners.heightChange = _this3.onHeightChange;
          } else {
            options.listeners = {
              heightChange: _this3.onHeightChange
            };
          }
        } else if (!instance) {
          if (vnode.data) {
            if (vnode.data.on) {
              vnode.data.on.heightChange = _this3.onHeightChange;
            } else {
              vnode.data.on = {
                heightChange: _this3.onHeightChange
              };
            }
          }
        } // 没有data的话，可能哪里存在问题


        if (vnode.data) {
          var style = vnode.data.style; // @ts-ignore

          var id = vnode.componentOptions.propsData.id;
          var top = _this3.topMap[id] + 'px';

          if (!style) {
            vnode.data.style = {
              top: top
            };
          } else if (typeof style === 'string') {
            vnode.data.style = style + "; top: ".concat(top);
          } else if (isPlainObject(style)) {
            // @ts-ignore
            vnode.data.style.top = top;
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
  }, {
    key: "idList",

    /** id列表 */
    get: function get() {
      return this.list.map(function (item) {
        return item.id;
      });
    }
    /** 所展示的条目列表 */

  }, {
    key: "displayList",
    get: function get() {
      return this.list.slice(this.startIndex, this.endIndex);
    }
  }]);

  return LargeListComponent;
}(Vue), _temp), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, "list", [_dec2], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "defaultItemHeight", [_dec3], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "defaultItemGap", [_dec4], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "persistence", [_dec5], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "load", [_dec6], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _applyDecoratedDescriptor(_class2.prototype, "onListChange", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "onListChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onEndIndexChange", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "onEndIndexChange"), _class2.prototype)), _class2)) || _class);

module.exports = LargeListComponent;
