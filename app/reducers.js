import {
  ADD_ELEMENT,
  REMOVE_ELEMENT,
  DOUBLE_ELEMENT,
  MOVE_ELEMENT,
} from './actions';
import {FULL} from './defs';

const newElement = chord => ({
  chord,
  duration: FULL
});

const initialState = {
  structure: ['C', 'Am', 'F', 'G'].map(newElement)
};

const remove = (arr, index) => [
  ...arr.slice(0, index),
  ...arr.slice(index + 1)
];

const insert = (arr, index, el) => [
  ...arr.slice(0, index),
  el,
  ...arr.slice(index)
];

function myApp(state = initialState, action) {
  switch (action.type) {
    case ADD_ELEMENT:
      return {
        ...state,
        structure: [
          ...state.structure,
          newElement(action.value)
        ]
      };
    case REMOVE_ELEMENT:
      return {
        ...state,
        structure: remove(state.structure, action.index)
      };
    case MOVE_ELEMENT: {
      const el = Object.assign({}, state.structure[action.index]);
      const newArr = remove(state.structure, action.index);
      const newStructure = insert(newArr, action.newIndex, el);
      console.log(newStructure);
      return {
        ...state,
        structure: newStructure
      };
    }
    case DOUBLE_ELEMENT:
      return {
        ...state,
        structure: [
          ...state.structure.slice(0, action.index),
          ...state.structure.slice(action.index, action.index + 1),
          ...state.structure.slice(action.index, action.index + 1),
          ...state.structure.slice(action.index + 1)
        ]
      };
    default:
      return state;
  }
}

import {combineReducers} from 'redux';

const myFinalApp = combineReducers({
  myApp
});

export default myFinalApp;
