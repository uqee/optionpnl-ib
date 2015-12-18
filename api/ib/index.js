'use strict';
var log = require('../../log');

// init

  var ib = new (require('ib'))({
    clientId: process.env.IB_CLIENTID || 0,
    host: process.env.IB_HOST || '127.0.0.1',
    port: process.env.IB_PORT || 7496
  });

// connection

  var _connectFlag;
  var _connectTimeout = 1000;

  function _connect () {
    log.print(log.LVL_INFO, 'ib', 'connecting...');
    ib.connect();
  }

  function _connected () {

    return _connectFlag;
  }

  ib.on('connected', function () {
    log.print(log.LVL_INFO, 'ib', 'connected');
    _connectFlag = true;
  });

  ib.on('disconnected', function () {
    log.print(log.LVL_INFO, 'ib', 'disconnected');
    _connectFlag = false;

    // reconnect
    _connectTimeout += 1000;
    setTimeout(_connect, _connectTimeout);
  });

// provide unique order ids

  var _orderid;
  ib.once('nextValidId', function (value) {
    _orderid = value || 1;
    log.print(log.LVL_XXL, 'ib', 'next valid order id', _orderid);
  });

// provide unique request ids

  var _id = 0;
  var _getId = function () { return _id++; };

// custom contracts

  function _convertContract (contract) {

    var ticker;
    if (/^[a-zA-Z]{1,5}$/.test(contract.ticker))
      ticker = contract.ticker.toUpperCase();

    var expiration;
    if (/^201[0-9]{5}$/.test('' + contract.expiration))
      expiration = '' + contract.expiration;

    var strike;
    if (/^\d+(\.\d{1,2})?$/.test(contract.strike))
      strike = parseFloat(contract.strike);

    var right;
    if (/^(?:put|call)$/.test(contract.right))
      right = contract.right.toUpperCase();

    if (!ticker) {
      log.print(log.LVL_XXL, 'ib', 'invalid contract', null, contract);
      return null;
    }
    
    else if (expiration && strike && right)
      return ib.contract.option(ticker, expiration, strike, right);
    
    else
      return ib.contract.stock(ticker);
  }

//
_connect();
module.exports = {
  mktdata: require('./mktdata')(ib, _connected, _getId, _convertContract),
  contractdetails: require('./contractdetails')(ib, _connected, _getId, _convertContract)
};
