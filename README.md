## Install

```bash
// npm
npm install large-list

// yarn
yarn add large-list
```

## Usage

```javascript
import LargeList from 'large-list';

Vue.component('LargeList', LargeList);
```

```html
<LargeList>
    <PostCard>
    </PostCard>
</LargeList>
```

子组件需要提供heightChange事件，并且将新的高度newHeight，以及自身的id作为事件参数。

```javascript
export default {
    name: 'PostCard',
    mounted() {
        this.$emit('heightChange', newHeight, id);
    },
}
```

## API

### LargeList Component

#### Props

------
key|type|description
---|---|---
list| ListItem[] | 列表数据
defaultItemHeight | number | 每项元素的默认高度
defaultItemGap | number | 两个列表元素之间的间隔
preloadHeight | number | 预先检测的高度
persistence | ({ metaMap: MetaMap, startIndex: nuumber, endIndex: number, containerHeight: number }) => void | 当传入persistence时，将尝试向persistence传入这些需要存储的数据
load | void | 当传入load时，将尝试通过load函数获取之前存储的数据

## Roadmap:

1. 考虑将render中的scopeSlots替换成事件逻辑