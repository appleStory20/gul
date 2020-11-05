// room_info.js

var room_info = function( roomNum, user, partner1, partner2, partner2, match ){
		this.roomNum = roomNum; 
		this.user = user; 
		this.partner1 = partner1; 
		this.partner2 = partner2; 
		this.partner3 = partner3; 
		this.match = match;
};

room_info.prototype = {
	getRoomNum : function(){
			        return this.roomNum;
	},
	getUser : function(){
		            return this.user;
	},
	getPartner1 : function(){
		            return this.partner1;
	},
	getPartner2 : function(){
		        return this.partner2;
	},
	getPartner3 : function(){
		        return this.partner3;
	},
	setPartner1 : function(partner){
		            this.partner = partner1;
	},
	setPartner2 : function(partner){
		            this.partner = partner2;
	},
	setPartner3 : function(partner){
		            this.partner = partner3;
	},
	getMatching:function(){
		            return this.match;
	},
	Matching:function(){
		            if(this.match == true){
				   		this.match = false;
				
			    }
		            else
				                this.match = true;
	}	
};

module.exports = room_info;
