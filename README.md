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

```
interface PersistenceOptions {
    metaMap: MetaMap;
    startIndex: nuumber;
    endIndex: number;
    containerHeight: number;
}
```

------
key|type|required|default|description
---|---|---|---|---
list              | ListItem[]                   | true  |       | data list
defaultItemHeight | number                       | false | 100   | default height of list item
defaultItemGap    | number                       | false | 10      default gap width of two list item
preloadHeight     | number                       | false | 200   | 预先检测的高度
persistence       | (PersistenceOptions) => void | false |       | 当传入persistence时，将尝试向persistence传入这些需要存储的数据
load              | () => PersistenceOptions     | false |       |当传入load时，将尝试通过load函数获取之前存储的数据

#### Event

----
name|description
---|---

## Roadmap:

1. 考虑将render中的scopeSlots替换成事件逻辑