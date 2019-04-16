# react-native-dragsortable
Drag and drop sort control for react-native


![GitHub license](https://img.shields.io/badge/license-MIT-green.svg)
[![npm](https://img.shields.io/npm/v/react-native-dragsortable.svg?style=flat)](https://npmjs.com/package/react-native-dragsortable)

### Performance

### Installation
```bash
yarn add react-native-dragsortable
or
npm i react-native-dragsortable --save 
```

### Example
```
import DragSortableView from 'DragSortableView';
```

``` react
this.state = {
	list:[]
}

const { list } = this.state;
<DragSortableView
	columnCount={4}
    onStartMove={() => {
		console.log("onStartMove");
	}}
	onDragStart={() => {
		console.log("onDragStart")
	}}
	onEndDrag={(items) => {
		console.log("onEndDrag", items)
		this.setState({
			list: items
		});
	}}
	renderItem={(item) => {
		// return item component
	}}
	data={list} />
```

### API
- **data**: PropTypes.array.isRequired :
- **maxSize**: PropTypes.number.isRequired //item width/height
- **columnCount**: PropTypes.number.isRequired, //default row item count,if the totalWidth/columnCount(**totalWidth=Dimensions.get('window').width**) larger than maxSize,this columnCount value will be **Math.floor(totalWidth/maxSize)** 
- **sortable**: PropTypes.bool, //default allow
- **onStartMove**: PropTypes.func, //click
- **onDragStart**: PropTypes.func, 
- **onDragEnd** : PropTypes.func,
- **renderItem** : PropTypes.func.isRequired, //render item view

### Thanks
- [mochixuan](https://github.com/mochixuan/react-native-drag-sort)