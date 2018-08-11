'use strict';
const express = require('express');
const app = express();
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const config = require('config');
const favicon = require('serve-favicon');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const timeout = require('connect-timeout');
const sanitize = require('mongo-sanitize');

var processexit = false;
const options = {
  auto_reconnect: true,
  reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
  reconnectInterval: 500, // Reconnect every 500ms
  poolSize: 1000, // Maintain up to 1000 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0,
  keepAlive: 120,
  useNewUrlParser: true,
  promiseLibrary: require('bluebird')
};

// const db = mongoose.connection;

// db.once('error', function (err) {
//   console.error('mongoose connection error' + err);
//   mongoose.disconnect();
// });
// db.on('open', function () {
//   console.log('successfully connected to mongoose');
// });
// db.on('reconnected', function () {
//   console.log('MongoDB reconnected!');
// });
// db.on('disconnected', function () {
//   console.log('MongoDB disconnected!');
//   if (!processexit) {
//     mongoose.connect(config.mongodb.uri, options)
//       .then(() => console.log('connection succesful'))
//       .catch((err) => console.error(err));
//   }

// });

// mongoose.connect(config.mongodb.uri, options);

// mongoose.connect(config.mongodb.uri, options)
//   .then(() => console.log('connection succesful'))
//   .catch((err) => console.error(err));

config.home_directory = __dirname;
const cacheoptions = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['js', 'css', 'jpg', 'png', 'jpeg', 'html'],
  index: false,
  // maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now())
  }
}

if (process.env.NODE_ENV !== 'development') {
  console.log('adding compression');
  //compression
  app.use(compression());
  // require('geoip-lite/scripts/updatedb.js');
} else {
  mongoose.set('debug', true);
}

app.use(timeout('60s'))
app.use(helmet());
app.use(haltOnTimedout);
//cookie parser
app.use(cookieParser())
app.use(haltOnTimedout)
//request ip middle ware
// app.use(requestIp.mw());
// function sanitizeCustom(req, res, next) {
//     console.log('testtttttttttttt');
//     next();
// }
// app.use(sanitizeCustom)



// get all data/stuff of the body (POST) parameters
app.use(bodyParser.json()); // parse application/json
app.use(bodyParser.json({
  type: 'application/vnd.api+json'
})); // parse application/vnd.api+json as json
app.use(bodyParser.urlencoded({
  extended: true
})); // parse application/x-www-form-urlencoded


app.use(methodOverride('X-HTTP-Method-Override')); // override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
if (process.env.NODE_ENV !== 'development') {
  console.log('adding chache options');
  app.use(express.static(__dirname + '/dist', cacheoptions)); // set the static files location /public/img will be /img for users
  app.use(express.static(__dirname + '../../BUSINESS_WAY2MONEY_COM/uploads',cacheoptions));
} else {
  app.use(express.static(__dirname + '../../way2money_mechant/uploads'));
  // console.log(__dirname + '/src/assets');
  app.use(express.static(__dirname + '/dist')); // set the static files location /src/assets will be /img for users
}
if (process.env.NODE_ENV !== 'development') {
  app.use(favicon(__dirname + '/dist/favicon.ico'));
} else {
  app.use(favicon(__dirname + '/src/favicon.ico'));
}

function logErrors(err, req, res, next) {
  console.log('in logErrors');
  console.error(err.stack)
  next(err)
}

function clientErrorHandler(err, req, res, next) {
  console.log('in clientErrorHandler');
  if (req.xhr) {
    res.status(500).send({
      error: 'Something failed!'
    })
  } else {
    next(err)
  }
}

app.use(logErrors);
app.use(clientErrorHandler);

const whitelist = config.cros
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.use(cors(), function (req, res, next) {
  // res.header("Access-Control-Allow-Origin", config.cros);
  // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  // res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

app.use(sanitizeCustom)

function sanitizeCustom(req, res, next) {
  let bodykeys = Object.keys(req.body);
  bodykeys.forEach(function (keyObj) {
    // console.log(keyObj,req.body[keyObj]);
    req.body.keyObj + '' == sanitize(req.body[keyObj]);
    // console.log(keyObj,req.body[keyObj]);
  });

  // console.log('query==',req.query);
  bodykeys = Object.keys(req.query);
  bodykeys.forEach(function (keyObj) {
    req.query.keyObj + '' == sanitize(req.query[keyObj]);
  });
  // console.log('query==', req.query);
  bodykeys = Object.keys(req.params);
  bodykeys.forEach(function (keyObj) {
    req.params.keyObj + '' == sanitize(req.params[keyObj]);
  });
  next();
}

// routes ==================================================
// require('./restapp/routes/routes')(app);
// require('./restapp/routes/merchant_routes')(app);
// // require('./restapp/routes/routes')(app);
// require('./restapp/routes/dashboard')(app);
// require('./restapp/routes/userRoutes')(app);
// require('./restapp/routes/settingsRoutes')(app);
// require('./restapp/routes/merchantRoutes')(app);
// require('./restapp/routes/sms_alerts_routes')(app);
// require('./restapp/routes/claim_requests_routes')(app);
// require('./restapp/routes/clearUserRoutes')(app);

app.get('*', function (req, res, next) {
  console.log("app.get('env')", app.get('env'));
  if (app.get('env') != 'development') {
    res.sendFile(__dirname + '/dist/index.html');
  } else {
    // res.redirect('http://localhost:4302/');
    // console.log("girija.shanker68@gmail.com");
    res.sendFile(__dirname + '/src/index.html');
  }
});


app.internalError = function (err, code, res) {
  const error = {};
  error.message = err;
  error.status = 'error';
  res.statusCode = code;
  return res.send(error);
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
} else {
  // production error handler
  // no stacktraces leaked to user
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: {}
    });
  });
}

app.use(function (err, req, res, next) {
  res.end(err.message); // this catches the error!!
});

function haltOnTimedout(req, res, next) {
  if (!req.timedout) next()
}

const port = normalizePort(config.port || '3333');
app.set('port', port);
// start app ===============================================
app.listen(port, config.host);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

process.on('uncaughtException', function (uncaught_exception) {
  console.error((new Date).toUTCString() + ' uncaughtException:', uncaught_exception.message)
  console.error(uncaught_exception);
});

process.on('unhandledRejection', function (unhandled_error) {
  console.error((new Date).toUTCString() + ' unhandledRejection:', unhandled_error.message)
  console.error(unhandled_error);
});

process.on('SIGINT', function () {
  console.log(' on exit called by node');
  processexit = true;
  mongoose.connection.close()
});

process.on('uncaughtException', function (e) {
  console.error('Uncaught Exception...');
  console.error(e.stack);
});

console.log('Magic happens on port ' + port); // shoutout to the user
exports = module.exports = app; // expose app
