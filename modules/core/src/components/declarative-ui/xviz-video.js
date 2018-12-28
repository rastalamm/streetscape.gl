import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

import styled from '@emotion/styled';
import {Dropdown, withTheme, evaluateStyle} from '@streetscape.gl/monochrome';
import ImageSequence from './image-sequence';
import connectToLog from '../connect';

import {normalizeStreamFilter} from '../../utils/stream-utils';

const WrapperComponent = styled.span(props => ({
  ...props.theme.__reset__,
  position: 'relative',
  ...evaluateStyle(props.userStyle, props)
}));

class BaseComponent extends PureComponent {
  static propTypes = {
    // User configuration
    style: PropTypes.object,
    width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),

    // From declarative UI video component
    cameras: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.array,
      PropTypes.object,
      PropTypes.func
    ]),

    // From connected log
    currentTime: PropTypes.number,
    imageFrames: PropTypes.object
  };

  static defaultProps = {
    style: {},
    width: '100%',
    height: 'auto'
  };

  constructor(props) {
    super(props);

    this.state = {
      ...this._getStreamNames(props)
    };
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.props.imageFrames !== nextProps.imageFrames ||
      this.props.cameras !== nextProps.cameras
    ) {
      this.setState(this._getStreamNames(nextProps));
    }
  }

  _getStreamNames({imageFrames, cameras}) {
    if (!imageFrames) {
      return {
        streamNames: null,
        selectedStreamName: null
      };
    }

    const streamNames = Object.keys(imageFrames)
      .filter(normalizeStreamFilter(cameras))
      .sort();
    let {selectedStreamName} = this.state || {};
    if (!streamNames.includes(selectedStreamName)) {
      selectedStreamName = streamNames[0] || null;
    }
    return {selectedStreamName, streamNames};
  }

  _onSelectVideo = streamName => {
    this.setState({selectedStreamName: streamName});
  };

  _renderVideoSelector() {
    const {style} = this.props;
    const {streamNames, selectedStreamName} = this.state;

    if (streamNames.length <= 1) {
      return null;
    }

    const data = {};
    streamNames.forEach(name => {
      // TODO - use display name from metadata
      data[name] = name;
    });

    return (
      <Dropdown
        style={style.selector}
        value={selectedStreamName}
        data={data}
        onChange={this._onSelectVideo}
      />
    );
  }

  render() {
    const {currentTime, imageFrames, width, height, style, theme} = this.props;
    const {selectedStreamName} = this.state;

    if (!currentTime || !selectedStreamName) {
      return null;
    }

    return (
      <WrapperComponent theme={theme} userStyle={style.wrapper}>
        <ImageSequence
          width={width}
          height={height}
          src={imageFrames[selectedStreamName]}
          currentTime={currentTime}
        />

        {this._renderVideoSelector()}
      </WrapperComponent>
    );
  }
}

const getLogState = log => ({
  currentTime: log.getCurrentTime(),
  imageFrames: log.getImageFrames()
});

export const XVIZVideoComponent = withTheme(BaseComponent);

export default connectToLog({getLogState, Component: XVIZVideoComponent});
