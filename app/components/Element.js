import React, {Component, PropTypes} from 'react';
import {DragSource, DropTarget} from 'react-dnd';
import {findDOMNode} from 'react-dom';
import flow from 'lodash/flow';

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

const elementStyleMiddle = Object.assign({
  top: '1em',
}, elementStyle);


class Element extends Component {
  render() {
    const {
      data,
      index,
      onRemove,
      onDouble,
      onHalve,
      // isDragging,
      connectDragSource,
      connectDropTarget,
    } = this.props;
    return connectDropTarget(connectDragSource(
      <li style={{
        position: 'relative',
        display: 'inline-block',
        paddingTop: '1em',
        width: '5em',
        height: '3em',
        lineHeight: '1em',
        textAlign: 'center',
        marginRight: '0.2em',
        border: '1px solid #999',
        // opacity: isDragging ? '0.5' : '1.0'
      }}>
        <span>{data.chord} {data.duration}</span>
        <a onClick={() => onRemove(index)} style={elementStyleTop}>X</a>
        <a onClick={() => onHalve(index)} style={elementStyleMiddle}>½</a>
        <a onClick={() => onDouble(index)} style={elementStyleBottom}>*2</a>
      </li>
    ));
  }
}

Element.propTypes = {
  data: PropTypes.any,
  index: PropTypes.number,
  onRemove: PropTypes.func,
  onDouble: PropTypes.func,
  onHalve: PropTypes.func,
  isDragging: PropTypes.bool,
  connectDragSource: PropTypes.func,
  connectDropTarget: PropTypes.func,
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
    // console.log('hover', dragIndex, hoverIndex);

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();
    const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
    // Determine mouse position
    const clientOffset = monitor.getClientOffset();
    const hoverClientX = clientOffset.x - hoverBoundingRect.left;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
      console.log('right');
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
      console.log('left');
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

const dropCollect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
});

export default flow(
  DragSource('element', source, dragCollect),
  DropTarget('element', target, dropCollect)
)(Element);
