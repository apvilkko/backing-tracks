import {ADD_ELEMENT, REMOVE_ELEMENT, DOUBLE_ELEMENT} from './actions';

const initialState = {
  structure: ['C', 'C', 'F', 'G']
};

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
      console.log(action.index);
      return Object.assign({}, state, {
        structure: [
          ...state.structure.slice(0, action.index),
          ...state.structure.slice(action.index + 1)
        ]
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
