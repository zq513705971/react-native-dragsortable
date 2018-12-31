/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View
} from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';

import ScrollPage from './src/example/ScrollPage';

console.disableYellowBox = true;
export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      component: undefined,
      selectedIndex: 0,
      options: [{
        name: 'ScrollPage',
        component: ScrollPage
      }]
    }
  }

  componentDidMount() {
    const { options, selectedIndex } = this.state;
    this.setState({
      component: options[selectedIndex].component
    });
  }

  _renderDropdownRow = (option, index, isSelected) => {
    return <Text>{option.name}</Text>;
  }

  _onSelectDropdown = (index, value) => {
    const { options } = this.state;
    this.setState({
      selectedIndex: index,
      component: options[index].component
    });
  }

  _renderButtonText = () => {
    const { options, selectedIndex } = this.state;
    return options[selectedIndex].name;
  }

  render() {
    const _component = this.state.component;
    return (
      <View style={styles.container}>
        <View style={{ height: 60, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <ModalDropdown options={this.state.options} renderRow={this._renderDropdownRow}
            onSelect={this._onSelectDropdown}
            renderButtonText={this._renderButtonText} />
        </View>
        <View style={{ flex: 1, width: '100%', backgroundColor: '#ebebeb' }}>
          {
            _component ? <_component /> : undefined
          }
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  }
});
