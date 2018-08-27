var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');

router.get('/:offset?', function(req, res, next) {
  // console.log(req);
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);

  async.waterfall([  //多个函数依次执行，且前一个的输出为后一个的输入
    function(callback) {
      web3.parity.listAccounts(20, req.params.offset, function(err, result) {
        callback(err, result);
      });
    }, function(accounts, callback) {
      
      var data = {};
      
      if (!accounts) {
        return callback({name:"FatDBDisabled", message: "Parity FatDB system is not enabled. Please restart Parity with the --fat-db=on parameter."});
      }
      
      if (accounts.length === 0) {
        return callback({name:"NoAccountsFound", message: "Chain contains no accounts."});
      }
      
      var lastAccount = accounts[accounts.length - 1];
      
      async.eachSeries(accounts, function(account, eachCallback) {
        web3.eth.getCode(account, function(err, code) {
          if (err) {
            return eachCallback(err);
          }
          data[account] = {};
          data[account].address = account;
          data[account].type = code.length > 2 ? "Contract" : "Account";

          async.waterfall([
            function(callback) {
              web3.eth.getBalance(account, function(err, balance) {
                if (err) {
                  return eachCallback(err);
                }
                data[account].balance = balance;
                callback(err, account);
              });
            },function(account, callback) {
              web3.eth.contract(config.tokenAbi).at(config.tokenAddress).balanceOf(account, function(err, SYCbalance) {
                if (err) {
                  return eachCallback(err);
                }
                data[account].SYCbalance = SYCbalance;
                callback(err);
              });
            }], function(err) {
              if (err) {
                return eachCallback(err);
              }
              eachCallback()
            })
        });
      }, function(err) {
        callback(err, data, lastAccount);
      });
    }
  ], function(err, accounts, lastAccount) {
    if (err) {
      return next(err);
    }
    
    res.render("accounts", { accounts: accounts, lastAccount: lastAccount });
  });
});

module.exports = router;
