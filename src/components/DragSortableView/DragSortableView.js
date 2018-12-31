import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Animated, Dimensions, Easing, PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native';

let window = Dimensions.get('window');

export default class DragSortableView extends Component {
    static defaultProps = {
        columnCount: 4,
        maxSize: 80,
        sortable: true,
        sortRefs: new Map(),
        defaultZIndex: 0,
        maxScale: 1.1,
        minOpacity: 0.8,
        longPressDuration: 1000
    }

    constructor(props) {
        super(props);

        this.state = {
            data: undefined,
            totalWidth: 0,
            itemSize: 0,
            columnCount: 0,
            totalHeight: 0,
            rowsCount: 0,
            touchZIndex: 0
        };
    }

    componentWillMount() {
        var { columnCount, maxSize, data } = this.props;
        var total = data.length;

        var totalWidth = window.width;
        if (totalWidth / columnCount > maxSize) {
            columnCount = Math.floor(totalWidth / maxSize);
        }
        var rowsCount = parseInt(total / columnCount);
        if (total % columnCount != 0)
            rowsCount = rowsCount + 1;
        var totalCount = rowsCount * columnCount;
        var itemSize = totalWidth / columnCount;


        var grid = [];
        const newDatas = data.map((item, index) => {
            const newData = {};
            const left = (index % columnCount) * itemSize;
            const top = parseInt((index / columnCount)) * itemSize;

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
                area: [top, left + itemSize, top + itemSize, left],
                saveIndex: index
            });
            newData.position = new Animated.ValueXY({
                x: left,
                y: top
            });
            newData.scaleValue = new Animated.Value(1);
            return newData;
        })

        this.setState({
            grid: grid,
            data: newDatas,
            itemSize: itemSize,
            totalWidth: totalWidth,
            rowsCount: rowsCount,
            columnCount: columnCount,
            totalHeight: rowsCount * itemSize,
            touchZIndex: totalCount
        });

        this._panResponder = PanResponder.create({
            onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
            onStartShouldSetPanResponderCapture: (evt, gestureState) => {
                this.isMovePanResponder = false
                return false
            },
            onMoveShouldSetPanResponder: (evt, gestureState) => this.isMovePanResponder,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => this.isMovePanResponder,

            onPanResponderGrant: (evt, gestureState) => { },
            onPanResponderMove: (evt, gestureState) => this._touchMove(evt, gestureState),
            onPanResponderRelease: (evt, gestureState) => this._touchEnd(evt),

            onPanResponderTerminationRequest: (evt, gestureState) => false,
            onShouldBlockNativeResponder: (evt, gestureState) => false,
        })
    }

    _handleStartShouldSetPanResponder = (e, gestureState) => {
        // 避免双击，与上次点击在500ms以内时不处理点击事件
        const tick = new Date().getTime();
        if (tick - this._touchTimeStamp < 500) {
            return false;
        }
        this._touchTimeStamp = tick;
        return true;
    }

    componentWillUnmount() {
        this.pressTimer && clearTimeout(this.pressTimer);
    }

    _touchMove = (nativeEvent, gestureState) => {
        const { totalWidth, itemSize, totalHeight, grid, data, touchZIndex } = this.state;

        if (this.touchCurItem) {
            let dx = gestureState.dx;
            let dy = gestureState.dy;

            const maxWidth = totalWidth - itemSize;
            const maxHeight = totalHeight - itemSize;

            //出界后取最大或最小值
            if (this.touchCurItem.originLeft + dx < 0) {
                dx = -this.touchCurItem.originLeft;
            } else if (this.touchCurItem.originLeft + dx > maxWidth) {
                dx = maxWidth - this.touchCurItem.originLeft;
            }
            if (this.touchCurItem.originTop + dy < 0) {
                dy = -this.touchCurItem.originTop;
            } else if (this.touchCurItem.originTop + dy > maxHeight) {
                dy = maxHeight - this.touchCurItem.originTop;
            }
            let left = this.touchCurItem.originLeft + dx;
            let top = this.touchCurItem.originTop + dy;
            let centerX = left + itemSize / 2;
            let centerY = top + itemSize / 2;

            this.touchCurItem.ref.setNativeProps({
                style: {
                    zIndex: touchZIndex,
                }
            })

            var itemData = this.touchCurItem.data;
            itemData.position.setValue({
                x: left,
                y: top,
            })

            var areaData = this._getAreaSpan(centerX, centerY);
            var moveToIndex = this.touchCurItem.moveToIndex;
            if (!areaData)
                moveToIndex = data.length - 1;
            else
                moveToIndex = areaData.index;

            if (this.touchCurItem.moveToIndex != moveToIndex) {
                this._resetSaveIndex();
                //将目标区域index清空
                areaData.saveIndex = -1;

                var tempIndex = 0;
                grid.forEach((item, index) => {
                    if (item.saveIndex != -1) {
                        for (let dataIndex = tempIndex; dataIndex < data.length; dataIndex++) {
                            const element = data[dataIndex];
                            if (element.originIndex != itemData.originIndex) {
                                item.saveIndex = element.index;
                                tempIndex = dataIndex + 1;
                                break;
                            }
                        }
                    }
                });
                areaData.saveIndex = itemData.index;
                this._tempMoveItemViews();
                this.touchCurItem.moveToIndex = moveToIndex;
            }
        }
    }

    /**
     * 根据中心位置计算区域序号
     */
    _getAreaSpan = (x, y) => {
        const { grid } = this.state;
        var data = grid.find(item => {
            let areaData = item.area;
            return y >= areaData[0] && y < areaData[2] && x >= areaData[3] && x < areaData[1];
        });
        if (data)
            return data;
        return grid[grid.length - 1];
    }

    _tempMoveItemViews = () => {
        const { grid } = this.state;
        const { sortRefs } = this.props;
        grid.forEach(item => {
            let index = item.saveIndex;
            let ref = sortRefs.get(index);
            let newPos = this._getPosition(item.index);
            var { left, top } = newPos;
            ref.setNativeProps({
                style: {
                    left: left,
                    top: top
                }
            })
        });
    };

    _getPosition = (index) => {
        const { itemSize, columnCount } = this.state;

        const left = (index % columnCount) * itemSize;
        const top = parseInt((index / columnCount)) * itemSize;
        return { left, top };
    }

    _resetSaveIndex = () => {
        const { grid } = this.state;
        grid.forEach(item => {
            item.saveIndex = item.index;
        });
    };

    _touchStart = (touchIndex) => {
        const { data } = this.state;
        const { sortable, sortRefs } = this.props;

        if (!sortable)
            return;

        var itemData = data[touchIndex];
        if (sortRefs.has(touchIndex)) {
            //重置saveIndex
            this._resetSaveIndex();
            this.touchCurItem = {
                data: itemData,
                ref: sortRefs.get(touchIndex),
                index: touchIndex,
                originLeft: itemData.originLeft,
                originTop: itemData.originTop,
                moveToIndex: touchIndex,
                startIndex: touchIndex,
                endIndex: touchIndex
            };
            //console.log("DragStart");
            this.isMovePanResponder = true;
            this.props.onDragStart && this.props.onDragStart(touchIndex);
        }
    }

    _onPressIn = (touchIndex) => {
        const { data } = this.state;
        const { longPressDuration, maxScale } = this.props;

        var itemData = data[touchIndex];

        this.pressTimer && clearTimeout(this.pressTimer);
        this.pressTimer = setTimeout(() => {
            Animated.timing(
                itemData.scaleValue,
                {
                    toValue: maxScale,
                    easing: Easing.out(Easing.quad),
                    duration: 10,
                    //useNativeDriver: true
                }
            ).start((data) => {
                if (data.finished) {
                    this._touchStart(touchIndex);
                }
            });
        }, longPressDuration);
        //模拟点击效果
        Animated.sequence([
            Animated.timing(
                itemData.scaleValue,
                {
                    toValue: maxScale,
                    easing: Easing.out(Easing.quad),
                    duration: 50,
                    //useNativeDriver: true
                }
            ),
            Animated.timing(
                itemData.scaleValue,
                {
                    toValue: 1,
                    easing: Easing.out(Easing.quad),
                    duration: 10,
                    //useNativeDriver: true
                }
            )
        ]).start();
    }

    _touchEnd = () => {
        const { data } = this.state;
        const { defaultZIndex } = this.props;

        this.pressTimer && clearTimeout(this.pressTimer);
        this.isMovePanResponder = false;
        if (this.touchCurItem) {
            var itemData = data[this.touchCurItem.index];
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
            this.touchCurItem.ref.setNativeProps({
                style: {
                    zIndex: defaultZIndex,
                }
            });
            if (this.props.onDragEnd) {
                this.props.onDragEnd(this.touchCurItem.index, this.touchCurItem.moveToIndex);
            }
            this._changePosition(this.touchCurItem.index, this.touchCurItem.moveToIndex);
            this.touchCurItem = undefined;
        }
    }

    _changePosition = (startIndex, endIndex) => {
        const { itemSize, data } = this.state;

        const curItem = data[startIndex];
        if (startIndex == endIndex) {
            data[startIndex].position.setValue({
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
        data.forEach((item, index) => {
            if ((offset < 0 && item.index > minIndex && item.index <= maxIndex) || (offset > 0 && item.index >= minIndex && item.index < maxIndex)) {
                item.index += offset;
            }
            if (item.originIndex == curItem.originIndex) {
                item.index = endIndex;
            }
        });
        const newDatas = [...data].map((item, index) => {
            let newPos = this._getPosition(item.index);
            item.originLeft = newPos.left;
            item.originTop = newPos.top;
            item.position = new Animated.ValueXY({
                x: newPos.left,
                y: newPos.top
            })
            //重新进行区域计算
            item.area = [newPos.top, newPos.left + itemSize, newPos.top + itemSize, newPos.left];
            return item;
        });

        newDatas.sort((a, b) => {
            return a.index > b.index ? 1 : -1;
        });

        this.setState({
            data: newDatas
        }, () => {
            //防止RN不绘制开头和结尾
            const startItem = data[startIndex];
            startItem.position.setValue({
                x: startItem.originLeft,
                y: startItem.originTop,
            });
            const endItem = data[endIndex];
            endItem.position.setValue({
                x: endItem.originLeft,
                y: endItem.originTop,
            });
        })
    }

    _onPressOut = (touchIndex) => {
        this.pressTimer && clearTimeout(this.pressTimer);
        if (!this.isMovePanResponder)
            this._touchEnd();
    }

    render() {
        const { totalWidth, itemSize, totalHeight, data } = this.state;
        const { sortRefs, defaultZIndex, maxScale, minOpacity } = this.props;

        return (
            <View style={[styles.container, {
                width: totalWidth,
                height: totalHeight,
            }]} >
                {
                    data.map((item, index) => {
                        return (
                            <Animated.View
                                key={item.originIndex}
                                ref={(ref) => sortRefs.set(item.index, ref)}
                                {...this._panResponder.panHandlers}
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
                                }]}>
                                <TouchableOpacity
                                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                                    activeOpacity={1}
                                    onLongPress={() => {
                                        //this.startTouch(index);
                                    }}
                                    onPressIn={() => {
                                        //console.log("onPressIn");
                                        this._onPressIn(item.index);
                                    }}
                                    onPressOut={() => {
                                        //console.log("onPressOut");
                                        this._onPressOut(item.index);
                                    }}
                                    onPress={() => {
                                        this.props.onClickItem && this.props.onClickItem(item.data, item.index);
                                    }}>
                                    {this.props.renderItem(item.data, item.index)}
                                </TouchableOpacity>
                            </Animated.View>
                        )
                    })
                }
            </View>
        )
    }
}

DragSortableView.propsTypes = {
    data: PropTypes.array.isRequired,
    maxSize: PropTypes.number.isRequired,
    columnCount: PropTypes.number.isRequired,

    sortable: PropTypes.bool,

    onClickItem: PropTypes.func,
    onDragStart: PropTypes.func,
    onDragEnd: PropTypes.func,
    renderItem: PropTypes.func.isRequired,
}

const styles = StyleSheet.create({
    container: {
        flexWrap: 'wrap',
        flexDirection: 'row',
    },
    item: {
        position: 'absolute',
        //borderWidth: 1,
        //borderColor: 'red'
    },
})