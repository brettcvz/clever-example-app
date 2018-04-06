const req = require('request');
const async = require('async');

CLIENT_ID = process.env.CLEVER_CLIENT_ID;
CLIENT_SECRET = process.env.CLEVER_CLIENT_SECRET;
REDIRECT_URL = process.env.REDIRECT_URL;

function runOAuthFlow(code, cb) {
  console.log("getting token");
  getToken(code, (err, token) => {
      if (err) { return cb(err); }

      console.log("getting me");
      request('/me', token, function(err, data){
          if (err) { return cb(err); }

          var data = data["data"];
          console.log("me data", data);
          var user = {
              id: data.id,
              type: data.type,
              token: token
          };
          console.log("user data", data);
          cb(undefined, user);
      });
  });
}

function getToken(code, cb) {
    var auth = new Buffer(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    var token_options = {
        url: 'https://clever.com/oauth/tokens',
        headers: { 'Authorization': 'Basic ' + auth },
        form: {
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': REDIRECT_URL
        },
        method: 'POST'
    };

    req(token_options, function(err, resp, body) {
        if (err) { return cb(err); }
        data = JSON.parse(body);
        cb(undefined, data['access_token']);
    });
}

function request(route, token, cb) {
    var url = `https://api.clever.com/v2.0${route}`;

    req({
        url: url,
        headers: { 'Authorization': `Bearer ${token}` }
    }, function(err, resp, body){
        if (err) {return cb(err);}
        var data;
        try {
            data = JSON.parse(body);
        } catch (err) {
            console.error(route, "Error parsing JSON:", body);
            return cb(new Error("JSON parse error"));
        }

        if (data.error) {
            return cb(new Error(`API Error: ${data.error}, ${body}`));
        }
        cb(undefined, data);
    });
}

function getMyInfo(user_id, user_type, token, cb) {
  var route = `/${user_type}s/${user_id}`;
  request(route, token, function(err, d){
      if (err) {return cb(err);}
      data = d["data"];

      return cb(undefined, data);
  });
}

function getMySections(user_id, user_type, token, cb) {
  var route = `/${user_type}s/${user_id}/sections`;
  request(route, token, function(err, d){
      if (err) {return cb(err);}
      data = d["data"];

      return cb(undefined, data);
  });
}

function getMySectionsWithStudents(user_id, user_type, token, cb) {
  var route = `/${user_type}s/${user_id}/sections`;
  request(route, token, function(err, d){
      if (err) {return cb(err);}
      const sections = d["data"];

      // for every section, go fetch the data for each of its students
      async.parallel(sections.map((s) => {
        return (cb2) => {
          getStudentsForSection(s.data.id, token, (err, students) => {
            s.data.students = students;
            cb2(err, s);
          });
        };
      }), (err, sections_with_students) => {
        return cb(undefined, sections_with_students);
      });
  });
}

function getStudentsForSection(section_id, token, cb) {
  var route = `/sections/${section_id}/students`;
  request(route, token, function(err, d){
      if (err) {return cb(err);}
      data = d["data"];

      return cb(undefined, data);
  });
}

module.exports = {
  request: request,
  runOAuthFlow: runOAuthFlow,
  getMyInfo: getMyInfo,
  getMySections: getMySections,
  getMySectionsWithStudents: getMySectionsWithStudents,
  getStudentsForSection: getStudentsForSection,
};
