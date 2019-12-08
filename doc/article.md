> 文章以及代码存放于[Github](https://github.com/Forzoom/large-list)。

列表是当前互联网产品中常见的组织/展现数据的一种形式，随着数据量不断变得庞大，我们会对数据进行分页，但是目前庞大的数据以及愈加丰富的内容，让我们的设备在维持大量数据时，性能上的瓶颈渐渐显示出来，我们的网页在滑动时可能会出现卡顿，这是这个组件所需要处理的问题。

在iOS开发中有名为UITableView的组件，在android开发中有被称为ListView的组件，它们通过销毁不可见区域的元素，来达到性能优化的目的，我们在组件当中也采用这样的逻辑，即便列表中有10000个元素，当屏幕可视区域中可能只有5个元素，那么我们只显示5个元素，这将大大减少我们的网页对于硬件资源的消耗。

下面是常见的列表渲染形式，`<PostCard>`就是我们所需要的展现的列表元素。

```html
<div class="large-list">
  <PostCard v-for="(post, index) in list" :key="post.id" :post="post"></PostCard>
</div>
```

```javascript
export default {
  name: 'LargeList',
  props: {
    list: {
      type: Array,
      default() {
        return [];
      },
    },
  },
};
```

先来考虑最简单的情况，假设所有的`<PostCard>`的高度都是100px，来实现上面所说的效果。list数组依然包含所有的元素数据，但我们需要另外一个数组，决定需要渲染list中的哪些元素。

```javascript
{
  // ...
  data() {
    return {
      startIndex: 0,
      endIndex: 0,
      // 容器高度信息
      containerHeight: 0,
    };
  },
  computed: {
    /**
     * 展示列表
     */
    displayList() {
      return this.list.slice(this.startIndex, this.endIndex);
    },
  }
  // ...
}
```

```html
<PostCard v-for="(post, index) in displayList" :key="post.id" :post="post"></PostCard>
```
现在我们要想办法确定`startIndex`和`endIndex`，`startIndex`是可视列表(displayList)中的第一个元素的下标，endIndex是最后一个元素的下标+1，在固定高度的情况下，`startIndex`和`endIndex`的计算十分简单

```javascript
{
  // ...
  created() {
    window.addEventListener('scroll', this.scrollCallback);
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.scrollCallback);
  },
  // ...
}
```
```javascript
{
  // ...
  methods: {
    /**
     * scroll事件处理函数，计算startIndex和endIndex
     */
    scrollCallback() {
      this.startIndex = Math.floor(window.scrollY / 100);
      this.endIndex = Math.floor((window.scrollY + window.innerHeight) / 100) + 1;
    },
  },
  // ...
}
```
到此为止，已经完成了一个最简单的逻辑，但是还没有完，还需要对元素的样式进行一些适当的补充
```html
<div class="large-list" :style="{height: containerHeight + 'px'}">
  <PostCard v-for="(post, index) in displayList" :key="post.id" :style="{top: metaMap[post.id].top + 'px'}"></PostCard>
</div>
```
```javascript
// 存储每个PostCard的一些样式数据
{
  // ...
  data() {
    return {
      metaMap: {},
    };
  },
  // ...
  crerated() {
    for (let i = 0, len = this.list.length; i < len; i++) {
      Vue.set(this.metaMap, post.id, {
        top: i * 100,
        height: 100,
      });
    }
  },
}
```
## 通用化：允许子元素高度变化

`<PostCard>`的高度可能在不同情况下显示高度不同，甚至在浏览过程中，可能实时地发生变化，组件应该做好子元素的高度会发生变化的准备。

当子元素的高度发生变化时，应该做什么？元素高度发生变化，其他元素的位置可能需要发生相应的修改，但是只需要更新其他可视元素的数据即可。

```javascript
{
  // ...
  methods: {
    /**
     * 子元素高度发生变化时的处理函数
     */
    onHeightChange(height, id) {
      // 更新容器的高度数据
      this.containerHeight += height - this.metaMap[id].height;
      // 更新元素的高度数据
      this.metaMap[id].height = height;
      // 更新 __高度发生变化的元素__ 之后的 __其他可视元素__ 的top数据
      const pos = this.displayList.map(post => post.id).indexOf(id) + 1;
      this.displayList.slice(pos).forEach((post, index) => {
        const prevPost = this.displayList[index - 1];
        this.metaMap[id].top = this.metaMap[prevPost.id].top + height;
      })
    },
  },
  // ...
}
```

当元素的高度不再固定时，`startIndex`和`endIndex`就不能那么轻松地计算出来，需要在整个`list`中寻找需要显示的列表内容，二分查找是个不错的选择。(二分查找并非本文重点，这里不再列出)

```javascript
{
  // ...
  methods: {
    scrollCallback() {
      this.startIndex = this.binarySearch(window.scrollY);
      this.endIndex = this.binarySearch(window.scrollY + window.innerHeight) + 1;
    },
  },
  // ...
}
```

## 通用化：允许子元素是任意组件

之前将`<PostCard>`组件直接在`<LargeList>`组件中注册，为了让`<LargeList>`适用于各种场景，子元素是什么样的，应该有`<LargeList>`的父元素决定

```html
<LargeList :list="list" @display-change="onDisplayChange">
  <PostCard v-for="(post, index) in displayList" :key="post.id" :post="post"></PostCard>
</LargeList>
```

```javascript
export default {
  data() {
    return {
      startIndex: 0,
      endIndex: 0,
    };
  },
  computed: {
    displayList() {
      return this.list.slice(this.startIndex, this.endIndex);
    },
  },
  methods: {
    onDisplayChange(startIndex, endIndex) {
      this.startIndex = startIndex;
      this.endIndex = endIndex;
    },
  },
}
```

自然我们更新LargeList中关于scroll的处理

```javascript
{
  methods: {
    scrollCallback() {
      startIndex = this.binarySearch(window.scrollY);
      endIndex = this.binarySearch(window.scrollY + window.innerHeight) + 1;
      // 使用display-change的形式来通知外部组件更新数据
      this.$emit('display-change', startIndex, endIndex);
    },
  },
}
```

使用slot的方式，需要解决一些问题：

1. 子元素样式改变，例如top位置的改变
2. 子元素的height-change事件监听

这是使用模板（template字段）所无法做到的事情，需要使用更加灵活的render函数来实现。

ps: 这里实现的render函数使用了官方文档中没有的内容，仅供参考。

```javascript
{
  // ...
  render(h) {
    const displayList = this.$slots.default || [];
    displayList.forEach((vnode) => {
      /** 组件实例 */
      const instance = vnode.componentInstance;
      /** 组件配置 */
      const options = vnode.componentOptions;
      // tip: 依赖于未公开的instance._events，并不是一件好事
      // 如果组件已经实例化，并且没有监听heightChange事件
      if (instance && !instance._events.heightChange) {
        instance.$on('heightChange', this.onHeightChange);
      } else if (options) {
        // 
        if (options.listeners) {
          options.listeners.heightChange = this.onHeightChange;
        } else {
          options.listeners = {
            heightChange: this.onHeightChange,
          };
        }
      } else if (!instance) {
        // 组件尚未实例化，还可以通过修改虚拟节点的数据的形式，来实施监听
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
      // todo: 没有data的话，可能哪里存在问题
      if (vnode.data) {
        const style = vnode.data.style;
        // 获取props中的id
        const id = vnode.componentOptions!.propsData!.id;
        const top = this.topMap[id] + 'px';
        if (!style) {
          vnode.data.style = {
            top,
          };
        } else if (typeof style === 'string') {
          vnode.data.style = style + `; top: ${top}`;
        } else if (isPlainObject(style)) {
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
  },
  // ...
}
```

## 优化: 完善细节表现

### 预先加载部分子元素

目前的逻辑是：当子元素进入可视区域内，再开始渲染元素。这种逻辑下，假如设备性能不佳，用户可能会有子元素“突然出现”的感觉。为了减轻这个问题的影响，在滑动过程中，不论向上还是向下滑动，都需要多渲染几个元素，通过修改`scrollCallback`函数的逻辑能够很方便地实现这个功能。

```javascript
{
  // ...
  props: {
    // 需要预先加载的高度
    preloadHeight: {
      type: Number,
      default: 100,
    },
  },
  methods: {
    scrollCallback() {
      const top = window.scrollY - this.preloadHeight;
      const bottom = window.scrollY + window.innerHeight + this.preloadHeight;
      this.startIndex = top < 0 ? 0 : this.binarySearch(top);
      this.endIndex = bottom < 0 ? 0 : this.binarySearch(bottom) + 1;
    },
  },
  // ...
}
```

### 解决metaMap数据丢失的问题

组件中的子元素显示位置全依赖于`metaMap`中的数据，当用户离开有`<LargeList>`的页面A，跳转到页面B，之后再返回A。`<LargeList>`随着A到B的过程中被销毁了，其中`metaMap`数据也就丢失了。

当用户从B回A时，遇到的一个问题是：需要额外消耗性能来重新处理子元素的高度变化。更主要的问题是：一般回到页面A时，会将页面A滚动到离开时的位置，此时因为没有原本的`metaMap`数据，所以渲染的结果与用户离开时所看到的内容可能不符。所能想到解决问题最简单的做法就是：当用户离开页面将`metaMap`保存下来。

`<LargeList>`对外提供两个prop: `persistence`和`load`，分别接收一个函数，用于存储数据和加载数据，具体数据存储和加载的方式，将由外层组件决定，这提供更好的灵活性。

```javascript
{
  // ...
  props: {
    /** 持久化 */
    persistence: {},
    /** 加载数据 */
    load: {},
  },
  created() {
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
        const height = this.defaultItemHeight;
        Vue.set(this.metaMap, id, {
          top: i * height,
          height,
        });
        containerHeight += height;
      }
      this.containerHeight = containerHeight;
    }
  },
  beforeDestroy() {
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
  // ...
}
```

### 为什么在子元素的实现中要传入名为id的prop

`<LargeList>`的slot中的子元素，要求接收一个名为id的prop，示例：

```javascript
export default {
  // ...
  props: {
    id: {
      required: true,
    },
  },
  // ...
}
```

这样做是因为，在render函数中需要获取子元素在`metaMap`中所对应的数据，但又没有很好的实现方式，如果有更好的实现方式的话，欢迎交流。

```javascript
// render函数中的部分代码
if (vnode.data) {
  const style = vnode.data.style;
  // 获取props中的id
  const id = vnode.componentOptions!.propsData!.id;
  const top = this.topMap[id] + 'px';
  if (!style) {
    vnode.data.style = {
      top,
    };
  } else if (typeof style === 'string') {
    vnode.data.style = style + `; top: ${top}`;
  } else if (isPlainObject(style)) {
    vnode.data.style.top = top;
  }
}
```
