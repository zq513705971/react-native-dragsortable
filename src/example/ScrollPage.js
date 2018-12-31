import React, { Component } from 'react'
import {
    StyleSheet,
    View,
    Text,
    Image,
    ScrollView,
    Dimensions
} from 'react-native'
import DragSortableView from '../components/DragSortableView';
import { DATA } from '../data/data';

export default class ScrollPage extends Component {
    constructor(props) {
        super(props);

        console.log(DATA);

        this.state = {
            data: DATA,
            scrollEnabled: true,
        }
    }

    _renderItem = (item, index) => {
        return (
            <View style={{ width: '100%', height: '100%', padding: 10 }}>
                <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "red", height: '100%', width: '100%' }}>
                    <Text>{item.name}</Text>
                </View>
            </View>
        )
    }

    render() {
        console.log(this.state.scrollEnabled);
        return (
            <ScrollView
                ref={(scrollView) => this.scrollView = scrollView}
                scrollEnabled={this.state.scrollEnabled}
                style={styles.container}>
                <View style={{ flex: 1, width: '100%', height: '100%' }}>
                    <DragSortableView
                        data={this.state.data}
                        onDragStart={(startIndex) => {
                            console.log("onDragStart")
                            this.setState({
                                scrollEnabled: false
                            })
                        }}
                        onDragEnd={(startIndex) => {
                            this.setState({
                                scrollEnabled: true
                            })
                        }}
                        onClickItem={(item, index) => {
                            console.log(item);
                        }}
                        renderItem={(item, index) => {
                            return this._renderItem(item, index);
                        }}
                    /></View>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})