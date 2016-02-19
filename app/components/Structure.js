import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import Element from './Element';
import {moveElement} from '../actions';

const mapDispatchToProps = dispatch => ({
  moveElement: (index, newIndex) => dispatch(moveElement(index, newIndex)),
});

@DragDropContext(HTML5Backend)
@connect(null, mapDispatchToProps)
class Structure extends Component {
  static propTypes = {
    structure: PropTypes.any,
    onRemove: PropTypes.func,
    onDouble: PropTypes.func,
    moveElement: PropTypes.func.isRequired,
  }

  render() {
    const {
      structure,
      onRemove,
      onDouble,
      moveElement
    } = this.props;

    return (
      <ul>
        {structure.map((val, index) =>
          <Element key={index}
            index={index}
            data={val}
            onRemove={onRemove}
            onDouble={onDouble}
            move={moveElement} />
        )}
      </ul>
    );
  }
}

export const SongStructure = ({structure, onRemove, onDouble}) => (
  <div>
    <div>Song structure</div>
    <Structure structure={structure} onRemove={onRemove} onDouble={onDouble} />
  </div>
);
