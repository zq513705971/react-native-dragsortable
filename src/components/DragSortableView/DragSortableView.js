import React, { Component } from 'react';
import { Animated, Dimensions, Easing, PanResponder, StyleSheet, TouchableOpacity, View, Text } from 'react-native';

const DragSortableView = (props) => {
    let window = Dimensions.get('window');
    let {
        columnCount = 4,
        maxSize = 100,
        sortable = true,
        defaultZIndex = 0,
        maxScale = 1.1,
        minOpacity = 0.8,
        totalWidth = window.width,
        data = [],
        onEndDrag = undefined,
        onDragStart = undefined,
        onStartMove = undefined,
        renderItem
    } = props;
    if (totalWidth / columnCount > maxSize) {
        columnCount = Math.ceil(totalWidth / maxSize);
    }
    let sortRefs = new Map();
    /*每块大小 */
    let itemSize = totalWidth / columnCount;
    //块数量
    let totalLength = data.length;
    //行数
    let rowsCount = Math.ceil(totalLength / columnCount);
    //总块数
    let totalCount = rowsCount * columnCount;
    //总高度
    let totalHeight = rowsCount * itemSize;
    let touchZIndex = totalCount;
    let isMovePanResponder = false;
    let granted = false;

    /**
     * 计算所在位置
     * @param {*} index 
     */
    const _getPosition = (index) => {
        const left = (index % columnCount) * itemSize;
        const top = Math.floor((index / columnCount)) * itemSize;
        return { left, top };
    };

    //正在拖拽的项
    let touchCurItem = undefined;
    let grid = [];
    let newDatas = data.map((item, index) => {
        const newData = {};
        const { left, top } = _getPosition(index);

        newData.data = item;
        newData.index = index;
        newData.originIndex = index;
        newData.originLeft = left;
        newData.originTop = top;
        newData.centerPos = new Animated.ValueXY({
            x: parseInt(left + itemSize / 2),
            y: parseInt(top + itemSize / 2)
        });
        newData.area = [top, left + itemSize, top + itemSize, left];
        grid.push({
            index: index,
            area: [...newData.area],
            saveIndex: index//初始化保存序号
        });
        newData.position = new Animated.ValueXY({
            x: left,
            y: top
        });
        newData.scaleValue = new Animated.Value(1);
        return newData;
    });

    /**
    * 根据中心位置计算区域序号
    */
    const _getAreaSpan = (x, y) => {
        var data = grid.find(item => {
            let areaData = item.area;
            return y >= areaData[0] && y < areaData[2] && x >= areaData[3] && x < areaData[1];
        });
        if (data)
            return data;
        return grid[grid.length - 1];
    }

    const _tempMoveItemViews = () => {
        grid.forEach(item => {
            let index = item.saveIndex;
            let ref = sortRefs.get(index);
            let newPos = _getPosition(item.index);
            var { left, top } = newPos;

            ref && ref.setNativeProps({
                style: {
                    left: left,
                    top: top
                }
            })
        });
    };

    let _touchTimeStamp = 0;
    const _onStartShouldSetPanResponder = () => {
        // 避免双击，与上次点击在500ms以内时不处理点击事件
        const tick = new Date().getTime();
        if (tick - _touchTimeStamp < 500) {
            return false;
        }
        _touchTimeStamp = tick;
        return false;
    }

    const _onPanResponderMove = (nativeEvent, gestureState) => {
        if (touchCurItem) {
            let dx = gestureState.dx;
            let dy = gestureState.dy;

            const maxWidth = totalWidth - itemSize;
            const maxHeight = totalHeight - itemSize;

            //出界后取最大或最小值
            if (touchCurItem.originLeft + dx < 0) {
                dx = -touchCurItem.originLeft;
            } else if (touchCurItem.originLeft + dx > maxWidth) {
                dx = maxWidth - touchCurItem.originLeft;
            }
            if (touchCurItem.originTop + dy < 0) {
                dy = -touchCurItem.originTop;
            } else if (touchCurItem.originTop + dy > maxHeight) {
                dy = maxHeight - touchCurItem.originTop;
            }
            let left = touchCurItem.originLeft + dx;
            let top = touchCurItem.originTop + dy;
            let centerX = left + itemSize / 2;
            let centerY = top + itemSize / 2;

            touchCurItem.ref.setNativeProps({
                style: {
                    zIndex: touchZIndex,
                }
            })

            var itemData = touchCurItem.data;
            itemData.position.setValue({
                x: left,
                y: top,
            })

            var areaData = _getAreaSpan(centerX, centerY);
            var moveToIndex = touchCurItem.moveToIndex;
            if (!areaData)
                moveToIndex = data.length - 1;
            else
                moveToIndex = areaData.index;

            if (touchCurItem.moveToIndex != moveToIndex) {
                _resetSaveIndex();
                //将目标区域index清空
                areaData.saveIndex = -1;

                var tempIndex = 0;
                grid.forEach((item, index) => {
                    if (item.saveIndex != -1) {
                        for (let dataIndex = tempIndex; dataIndex < data.length; dataIndex++) {
                            const element = newDatas[dataIndex];
                            if (element.originIndex != itemData.originIndex) {
                                item.saveIndex = element.index;
                                tempIndex = dataIndex + 1;
                                break;
                            }
                        }
                    }
                });
                areaData.saveIndex = itemData.index;
                _tempMoveItemViews();
                touchCurItem.moveToIndex = moveToIndex;
            }
        }
    }

    const _changePosition = (startIndex, endIndex) => {
        const curItem = newDatas[startIndex];
        if (startIndex == endIndex) {
            curItem.position.setValue({
                x: curItem.originLeft,
                y: curItem.originTop,
            });
            return;
        }

        var offset = 1;
        var minIndex = Math.min(startIndex, endIndex);
        var maxIndex = Math.max(startIndex, endIndex);
        if (startIndex < endIndex) {
            //从前往后移动，介于起始之后、结束位置的index依次-1
            offset = -1;
        }
        //移动起始、结束间各个块的index
        newDatas.forEach((item, index) => {
            if ((offset < 0 && item.index > minIndex && item.index <= maxIndex) || (offset > 0 && item.index >= minIndex && item.index < maxIndex)) {
                item.index += offset;
            }
            if (item.originIndex == curItem.originIndex) {
                item.index = endIndex;
            }
            let newPos = _getPosition(item.index);
            item.originLeft = newPos.left;
            item.originTop = newPos.top;
            item.position = new Animated.ValueXY({
                x: newPos.left,
                y: newPos.top
            })
            //重新进行区域计算
            item.area = [newPos.top, newPos.left + itemSize, newPos.top + itemSize, newPos.left];
        });
        newDatas.sort((a, b) => {
            return a.index > b.index ? 1 : -1;
        });
    }

    const _touchEnd = () => {
        isMovePanResponder = false;
        if (touchCurItem) {
            var itemData = newDatas[touchCurItem.index];

            Animated.timing(
                itemData.scaleValue,
                {
                    toValue: 1,
                    easing: Easing.out(Easing.quad),
                    duration: 0,
                    //useNativeDriver: true
                }
            ).start((data) => {
                //console.log(data.finished);
            });
            touchCurItem.ref.setNativeProps({
                style: {
                    zIndex: defaultZIndex,
                }
            });

            _changePosition(touchCurItem.index, touchCurItem.moveToIndex);

            let newList = [];
            newDatas.forEach((item, index) => {
                newList.push(item.data);
            });
            onEndDrag && onEndDrag(newList);

            touchCurItem = undefined;
        }
    }

    const _onPanResponderRelease = () => {
        isMovePanResponder = false;
        _touchEnd();
    }

    const _resetSaveIndex = () => {
        grid.forEach(item => {
            item.saveIndex = item.index;
        });
    };

    const _touchStart = (touchIndex) => {
        if (!sortable)
            return;
        var touchItemData = newDatas[touchIndex];
        if (sortRefs.has(touchIndex)) {
            _resetSaveIndex();

            touchCurItem = {
                data: touchItemData,
                ref: sortRefs.get(touchIndex),
                index: touchIndex,
                originLeft: touchItemData.originLeft,
                originTop: touchItemData.originTop,
                moveToIndex: touchIndex,
                startIndex: touchIndex,
                endIndex: touchIndex
            }
            Animated.timing(
                touchItemData.scaleValue,
                {
                    toValue: maxScale,
                    easing: Easing.out(Easing.quad),
                    duration: 10,
                    //useNativeDriver: true
                }
            ).start((result) => {
                if (result.finished) {

                }
            });
            onDragStart && onDragStart(touchIndex);
            isMovePanResponder = true;
        }
    }

    const _panResponder = PanResponder.create({
        onStartShouldSetPanResponder: _onStartShouldSetPanResponder,
        onStartShouldSetPanResponderCapture: (e, gestureState) => false,

        onMoveShouldSetPanResponder: (e, gestureState) => isMovePanResponder,
        onMoveShouldSetPanResponderCapture: (e, gestureState) => isMovePanResponder,

        onPanResponderMove: _onPanResponderMove,
        onPanResponderRelease: _onPanResponderRelease,

        onPanResponderTerminationRequest: (e, gestureState) => false,
        onShouldBlockNativeResponder: (e, gestureState) => false,
        onPanResponderGrant: () => {
            onStartMove && onStartMove();
            granted = true;
        }
    })

    const _guid = () => {
        function S4() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    }

    return <View style={[styles.container, {
        width: totalWidth,
        height: totalHeight,
    }]} >
        {
            newDatas.map((item, index) => {
                return (
                    <Animated.View
                        key={_guid()}
                        ref={(ref) => sortRefs.set(item.originIndex, ref)}
                        {..._panResponder.panHandlers}
                        style={[styles.item, {
                            zIndex: defaultZIndex,
                            width: itemSize,
                            height: itemSize,
                            left: item.position.x,
                            top: item.position.y,
                            opacity: item.scaleValue.interpolate({
                                inputRange: [1, maxScale],
                                outputRange: [1, minOpacity]
                            }),
                            transform: [
                                { scale: item.scaleValue }
                            ]
                        }]}
                    >
                        <TouchableOpacity
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            activeOpacity={1}
                            onPressOut={() => {
                                !granted && _touchEnd();
                            }}
                            onLongPress={() => {
                                _touchStart(item.index);
                            }}>
                            {renderItem && renderItem(item.data, item.index)}
                        </TouchableOpacity>
                    </Animated.View>
                )
            })
        }
    </View>;
}

const styles = StyleSheet.create({
    container: {
        flexWrap: 'wrap',
        flexDirection: 'row',
    },
    item: {
        position: 'absolute'
    },
})

export default DragSortableView;