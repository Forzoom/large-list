```javascript
import LargeList from 'large-list';

Vue.component('', LargeList);
```

问题:

1. 编译大小: 目前再cjs方式下，大小为27k，可能是因为使用vue-property-decorator的问题
2. 需要生成module对应的type定义?