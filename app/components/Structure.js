import React, {Component, PropTypes} from 'react';
import Element from './Element';
import {DragDropContext} from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

class Structure extends Component {
  static propTypes = {
    structure: PropTypes.any,
    onRemove: PropTypes.func,
    onDouble: PropTypes.func,
  }
  render() {
    const {structure, onRemove, onDouble} = this.props;
    return (
      <ul>
        {structure.map((val, index) =>
          <Element key={index} index={index} data={val} onRemove={onRemove} onDouble={onDouble} />
        )}
      </ul>
    );
  }
}
const DndStructure = DragDropContext(HTML5Backend)(Structure);

export const SongStructure = ({structure, onRemove, onDouble}) => (
  <div>
    <div>Song structure</div>
    <DndStructure structure={structure} onRemove={onRemove} onDouble={onDouble} />
  </div>
);
