export const ADD_ELEMENT = 'ADD_ELEMENT';
export const DOUBLE_ELEMENT = 'DOUBLE_ELEMENT';
export const REMOVE_ELEMENT = 'REMOVE_ELEMENT';
export const MOVE_ELEMENT = 'MOVE_ELEMENT';

export const addElement = value => ({type: ADD_ELEMENT, value});
export const doubleElement = index => ({type: DOUBLE_ELEMENT, index});
export const removeElement = index => ({type: REMOVE_ELEMENT, index});
export const moveElement = (index, newIndex) => ({type: MOVE_ELEMENT, index, newIndex});
