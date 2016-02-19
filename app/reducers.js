import {
  ADD_ELEMENT,
  REMOVE_ELEMENT,
  DOUBLE_ELEMENT,
  MOVE_ELEMENT,
} from './actions';

const initialState = {
  structure: ['C', 'C', 'F', 'G']
};

const remove = (arr, index) => [
  ...arr.slice(0, index),
  ...arr.slice(index + 1)
];

const insert = (arr, index, el) => [
  ...arr.slice(0, index),
  el,
  ...arr.slice(index + 1)
];

function myApp(state = initialState, action) {
  switch (action.type) {
    case ADD_ELEMENT:
      return {
        ...state,
        structure: [
          ...state.structure,
          action.value
        ]
      };
    case REMOVE_ELEMENT:
      return Object.assign({}, state, {
        structure: remove(state.structure, action.index)
      });
    case MOVE_ELEMENT:
      return Object.assign({}, state, {
        structure: insert(
          remove(state.structure, action.index),
          action.newIndex,
          state.structure[action.index]
        )
      });
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
