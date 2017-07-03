// Copyright 2004-present Facebook. All Rights Reserved.

/* eslint-disable no-unused-vars */

import React from 'react';
import {shallow} from 'enzyme';
import CheckboxWithLabel from '../checkbox_with_label';

it('CheckboxWithLabel changes the text after click', () => {
  // Render a checkbox with label in the document
  const checkbox = shallow(<CheckboxWithLabel labelOn="On" labelOff="Off" />);

  expect(checkbox.text()).toEqual('Off');

  checkbox.find('input').simulate('change');

  expect(checkbox.text()).toEqual('On');
});
