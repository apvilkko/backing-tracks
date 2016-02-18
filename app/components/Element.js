import React, {Component, PropTypes} from 'react';
import {DragSource} from 'react-dnd';

const elementStyle = {
  position: 'absolute',
  right: '0.1em',
  width: '1em',
};

const elementStyleTop = Object.assign({
  top: '0.1em',
}, elementStyle);

const elementStyleBottom = Object.assign({
  bottom: '0.1em',
}, elementStyle);

class Element extends Component {
  render() {
    const {data, index, onRemove, onDouble, isDragging, connectDragSource} = this.props;
    return connectDragSource(
      <li style={{
        position: 'relative',
        display: 'inline-block',
        padding: '1em 2em',
        marginRight: '0.2em',
        border: '1px solid #999',
      }}>
        <span>{data}{isDragging ? ' [D]' : ''}</span>
        <a onClick={() => onRemove(index)} style={elementStyleTop}>-</a>
        <a onClick={() => onDouble(index)} style={elementStyleBottom}>+</a>
      </li>
    );
  }
}

Element.propTypes = {
  data: PropTypes.any,
  index: PropTypes.number,
  onRemove: PropTypes.func,
  onDouble: PropTypes.func,
  isDragging: PropTypes.bool,
  connectDragSource: PropTypes.func,
};

const source = {
  beginDrag() {
    return {};
  }
};

const collect = (connect, monitor) => ({
  // Call this function inside render()
  // to let React DnD handle the drag events:
  connectDragSource: connect.dragSource(),
  // You can ask the monitor about the current drag state:
  isDragging: monitor.isDragging()
});

export default DragSource('element', source, collect)(Element);
