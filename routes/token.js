var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');

router.get('/token', function(req, res, next) {
    var config = req.app.get('config');  
	var web3 = new Web3();
	web3.setProvider(config.provider);

	// console.log(config);
	var myContract = web3.eth.contract(config.tokenAbi).at(config.tokenAddress);
	var allEvents = myContract.allEvents({fromBlock: 0, toBlock: 'latest'});;

	allEvents.watch(function(err,event){
		if(!err){
			// console.log(event);
		}
	})

	allEvents.get(function(err,logs){
		// console.log(logs);
		async.waterfall([
			function(callback){
				var logsData = logs;
				// logsData.forEach(function(log) {
				// 	web3.eth.getBlock(log.blockNumber, false, function(err, block) {
				// 		// console.log(block);
				// 	    if (err) {
				// 	        console.log("Error retrieving block information for log:", err);
				// 	        callback();
				// 	        return;
				// 	    }
					      
				// 	    log.timestamp = block.timestamp;
				// 	    // console.log(log);
					      
				// 	    if (log.args && log.args.value) {
				// 	        log.args._value = log.args.value.toNumber();
				// 	    }
				//   	})
				// })
				// callback(err, logsData);

				async.eachSeries(logsData, function(log, eachCallback) {
			        web3.eth.getBlock(log.blockNumber, function(err, block) {
			          if (err) {
			            return eachCallback(err);
			          }
			          log.timestamp = block.timestamp;
			          if (log.args && log.args.value) {
				        // console.log(log.args.value);
				        log.args.value = log.args.value.toNumber();
				      }
			          eachCallback();
			        });
		        }, function(err) {
		            callback(err, logsData);
		        });
			}], function(err,logsData){
				console.log(logsData);
				res.render("token",{"events":logsData}); 
			})
		
		// console.log(logsData);
		
	})

});

module.exports = router;