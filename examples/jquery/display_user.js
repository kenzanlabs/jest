// Copyright 2004-present Facebook. All Rights Reserved.

const $ = require('jquery');
const fetchCurrentUser = require('./fetch_current_user');

$('#button').click(() => {
  fetchCurrentUser(user => {
    const loggedText = 'Logged ' + (user.loggedIn ? 'In' : 'Out');
    $('#username').text(user.fullName + ' - ' + loggedText);
  });
});
