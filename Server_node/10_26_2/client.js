// client.js


var client = function(socket, account  ){
	    this.socket = socket;
	    this.account = account;
};

client.prototype = {

	    getSocket:function(){
		            return this.socket;
		        },
	    getAccount:function(){
		            return this.account;
		        }
};

module.exports = client;

