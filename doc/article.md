今天所实现的组件我称为“超长列表”，列表是当前互联网产品中常见的组织/展现数据的一种形式，随着数据量不断变得庞大，我们会对数据进行分页，但是目前庞大的数据以及愈加丰富的内容，让我们的设备在维持大量数据时，性能上的瓶颈渐渐显示出来，我们的网页在滑动时可能会出现卡顿，这是这个组件所需要处理的问题。

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

先来考虑最简单的情况，假设所有的`<PostCard>`的高度都是100，来实现上面所说的效果。list数组依然包含所有的数据，但我们需要另外一个数组，决定需要展示哪些数据。

```javascript
// js修改如下
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
```

```html
<!--html修改如下-->
<PostCard v-for="(post, index) in displayList" :key="post.id" :post="post"></PostCard>
```
现在我们要想办法确定`startIndex`和`endIndex`，`startIndex`是可视列表(displayList)中的第一个元素的下标，endIndex是最后一个元素的下标+1，在固定高度的情况下，`startIndex`和`endIndex`的计算十分简单

```javascript
// 首先我们为LargeList添加scroll事件的监听
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
// 添加scroll处理函数 scrollCallback
{
  // ...
  methods: {
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

这是使用模板所无法做到的事情，需要使用更加灵活的render函数来实现。

```javascript
public render(h: typeof Vue.prototype.$createElement) {
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
    // 没有data的话，可能哪里存在问题
    if (vnode.data) {
      const style = vnode.data.style;
      // @ts-ignore
      const id = vnode.componentOptions!.propsData!.id;
      const top = this.topMap[id] + 'px';
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
```