import React, {Component, PropTypes} from 'react';
import {DragSource, DropTarget} from 'react-dnd';
import {findDOMNode} from 'react-dom';

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
  beginDrag(props) {
    return {
      index: props.index
    };
  }
};

const target = {
  hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientY = clientOffset.y - hoverBoundingRect.top;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
      return;
    }

    // Time to actually perform the action
    props.move(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  }
};

const dragCollect = (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
});

const dropCollect = connect => ({
  connectDropTarget: connect.dropTarget()
});

export default DropTarget('element', target, dropCollect)(
  DragSource('element', source, dragCollect)(Element)
);
