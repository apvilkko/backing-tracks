import {connect} from 'react-redux';
import {SongStructure} from '../components/Structure';
import {
  removeElement,
  doubleElement,
  halveElement
} from '../actions';

const mapStateToProps = state => ({...state.myApp});
const mapDispatchToProps = dispatch => ({
  onRemove: index => dispatch(removeElement(index)),
  onDouble: index => dispatch(doubleElement(index)),
  onHalve: index => dispatch(halveElement(index)),
});

const SongStructureContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(SongStructure);

export default SongStructureContainer;
