import React from 'react';
import {connect} from 'react-redux';
import {addElement} from '../actions';

let AddElement = ({dispatch}) => {
  let input;

  return (
    <div>
      <form onSubmit={e => {
        e.preventDefault();
        if (!input.value.trim()) {
          return;
        }
        dispatch(addElement(input.value));
        input.value = '';
      }}>
        <input ref={node => {
          input = node;
        }} />
        <button type="submit">+</button>
      </form>
    </div>
  );
};
AddElement = connect()(AddElement);

export default AddElement;
