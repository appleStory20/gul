// index.js
// writer : peten486@gmail.com
// date : 2017.09.24 
/* modify 
2017.10.01 random chat complete
2017.10.02 friend talk add....
2017.10.09 bug fix
*/


/* 
it talk socket.io 패킷 형식 
처음시작			STA
처음시작 후 대기	SWI  
발송메시지			SMG
수신메시지			RMG
랜덤 시작신청 메시지	RCS
랜덤 시작확인 		RSM
랜덤 매칭 대기		RMI 	
랜덤채팅 종료		REN
친구추가			AFM	
친구추가 후 정보전달	AFD 
친구거절			NOF	
친구추가 완료		AFS
친구삭제			RFM 
친구삭제 완료		RFO 
*/

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');

var bodyParser = require('body-parser');
app.use(bodyParser.json());

// custom module(class?)
var client = require('./client');
var room_info = require('./room_info');
var json_type = require('./json_type');

// custom variable
var client_list = {}; 
var serial_list = [];
var room_m_list = []; // 매칭된 방
var room_u_list = []; // 매칭되지 않은 방
var results = [] ; // 테스트 sql 결과값 
var json = new json_type('','');

var db = mysql.createConnection({
	host: 'localhost',
	user: 'ys',
	password: '1q2w3e4r!',
	database: 'Dcrew'
});

// php 에서 넘어온 아이디 저장 변수
var account;
var c_dep; // 학과
var c_grade; //학년

//server start
app.get('/', function (req, res) {
  res.send('<center><H2>it talk Server started</H2></br>programmer : peten486@gmail.com</br>iTcore</center>');
});
http.listen(9999, function () {
  console.log('listening on *:9999');
  console.log('programmer : peten');
});


// php 에서 아이디 전달 받기
app.post('/', function(req, res){
	var content =req.body;

	account = content.ID;
	console.log(account);
	console.log(content.ID);
//	console.log(req);
	res.end('ok');
});


// sql select 출력 함수 
var pushResults = function( rows) {
	for(var i=0; i<results.length; i++){
		results.push(rows[i].resultId);
	}
}

db.connect();

// socket connection state;
io.sockets.on('connection', function (socket) {
  // 처음 시작
  socket.on("STA", function(msg){
  	// 소켓 연결 후
  	// serial_list 에 추가
  	// client_list 에 추가
  	// SWI 명령 전송
	  // sql 테스트
	 // db.connect();
	  db.query("SELECT * FROM user WHERE account = ?;" , [account] , function(err, rows, fields){
		  if(!err){
		  //pushResults(results); 
		


		// sql에서 뽑은 값을 서버에 저장 
		  for(var i =0; i<rows.length; i++){
			  c_dep = rows[i].department;
			  c_grade = rows[i].grade;
			  console.log(c_dep +" " +c_grade);
		  }


	  	  //console.log(results);
		  }
		  else{
			console.log(err);	  
		  }
		 // db.end();
	  });
   	 console.log( msg);
	 serial_list.push(msg.serial);
	 if(client_list[msg.serial] == null){
		client_list[msg.serial] = new client(socket, msg.serial, msg.name);
	 }
	 else {
		reRegistration(msg.serial, msg.name, socket);
		console.log("[err] This serial is a duplicate.");
	}
  	socket.emit("RMG", JSON.stringify(json.getJsonData(1)));
  });

  // 랜덤 채팅 시작 메시지 발신
  socket.on("RCS", function(msg){
  	// 매칭 실행
  	// 매칭 되면 RSM 명령 전송
  	matchingRandom(socket, msg.serial);
  });

  // 발송 메시지
  socket.on('SMG', function (msg) {
   	 console.log(msg);
       	 var temp_serial = null;
  	 for(var cur_index in serial_list){
      		if(client_list[serial_list[cur_index]] != null){
    			if(client_list[serial_list[cur_index]].getSocket() == socket){
    				temp_serial = serial_list[cur_index];
    			}
      		}			
  	}
  	
  	// 현재 소켓의 시리얼이 room_m_list에 있다면 랜덤채팅,
  	// 없다면 일반 채팅
  	if(temp_serial != null){
      		var partner_serial = null;
	  	if(room_m_list[temp_serial] != null){
	  		// 랜덤 채팅 
	  		partner_serial = room_m_list[temp_serial].getPartner();

        		if(client_list[room_m_list[temp_serial].getPartner()] != null){
	  		 // RMG : 수신 메시지
	  		 client_list[partner_serial].getSocket().emit("RMG",msg);
        		}		
	  	}
		else {
			// 일반 채팅
			if(msg.serial != null ){
				partner_serial = msg.serial;
				if(client_list[msg.serial] != null){
					client_list[partner_serial].getSocket().emit("RMG",msg);
					
				}
				else {
					console.log("[err] client_list[partner_serial] is null");
				}
			}
			else {
				onsole.log("[err] partner_serial is null");
			}
	  	}
	}
  });

  // 소켓 연결해제
  socket.on("disconnect", function (msg) {
  	disconnectUser(socket);
  });

  // 랜덤채팅 종료
  socket.on("REN", function (msg) {
  	endMatching(socket);
  });

});


// 랜덤 매칭 알고리즘 
function matchingRandom(socket, serial){
	// 실행되면 RMI 명령 전송
	socket.emit("RMG", JSON.stringify(json.getJsonData(2)));

	// 방이 있는지 확인
	// 방이 존재 하면 매칭
	// 없으면 새로 방을 생성
	// 매칭 되면 RSM 명령 전송 
	if(getUnMatchingRoomCnt() > 0){
		
		for(var cur_index in serial_list){
			if(serial_list[cur_index] != serial && serial != null){
				var room_name = serial_list[cur_index];
				room_m_list[serial] = new room_info(serial, serial_list[cur_index] ,room_name, true);
				room_m_list[serial_list[cur_index]] = new room_info(serial_list[cur_index], serial,room_name, true); 
				socket.join(room_name);

       				// room_u_list 제거
				delete room_u_list[serial_list[cur_index]];

        			if(room_m_list[serial_list[cur_index]] != null && client_list[serial_list[cur_index]] != null){
				  	socket.emit("RMG", JSON.stringify(json.getJsonData(3)));
				  	client_list[serial_list[cur_index]].getSocket().emit("RMG", JSON.stringify(json.getJsonData(3)));
				}
				else {
				          console.log("room_m_list[serial_list[cur_index]] is null");
        			}
        		break;
			}
		}

	}
	else {
		room_u_list[serial] = new room_info(serial,'', serial,false);
		socket.join(serial);
 	 }
  
}

// 랜덤 매칭 되지 않은 방 개수 
function getUnMatchingRoomCnt(){
	var cnt = Object.keys(room_u_list).length;
	return cnt;
}

// 랜덤채팅 종료
function endMatching(socket){
	// 소켓으로 client_list 에서 소켓을 찾고,
	// room_m_list에서 찾아서 matching 정보를 바꿔주고 
	// user 와 partner 의 room_m_list 의 정보를 삭제
	// 그리고 partner 에게 REN 명령 전송

	var temp_serial = null;
  	for(var cur_index in serial_list){
			if(serial_list[cur_index] == null){
				console.log('[err] disconnectUser : serial_list[cur_index] is null');
			}
			if(client_list[serial_list[cur_index]] != null){
				if (client_list[serial_list[cur_index]].getSocket() == socket) {
					temp_serial = serial_list[cur_index];
				}
				else{
					console.log("[err] client_list[serial_list[cur_index]].getSocket() is null");
				}
			} 
			else {
				console.log("[err] client_list[serial_list[cur_index]] is null");
			}
  	}

  	if(temp_serial != null && room_m_list[temp_serial] != null){
	  	var partner_serial = room_m_list[temp_serial].getPartner();
	  	
      		if(partner_serial != null){
        	delete room_m_list[temp_serial];
	  	delete room_m_list[partner_serial];
      		}

      		if(client_list[partner_serial] != null){
        	client_list[partner_serial].getSocket().emit("RMG",JSON.stringify(json.getJsonData(5)));
      		}
	} 
}

// 소켓 연결 해제 
function disconnectUser(socket) {
	var temp_serial = null;
	for (var cur_index in serial_list) {
		if(serial_list[cur_index] == null){
			console.log('[err] disconnectUser : serial_list[cur_index] is null');
		}
		if(client_list[serial_list[cur_index]] != null){
			if (client_list[serial_list[cur_index]].getSocket() == socket) {
			      	temp_serial = serial_list[cur_index];
    			}
			else{
				console.log("[err] client_list[serial_list[cur_index]].getSocket() is null");
			}
		}
		else {
			console.log("[err] client_list[serial_list[cur_index]] is null");
		}
  	}	

	if (temp_serial != null) {
		delete client_list[temp_serial];
    
		if(room_m_list[temp_serial] != null){
    			delete room_m_list[temp_serial];
  		}	
		else {
			console.log('[err] disconnectUser : room_m_list[temp_serial] is null');
    		}		
  	
	if (room_u_list[temp_serial] != null){
  		delete room_u_list[temp_serial];
    	}
	else {
	      console.log('[err] disconnectUser : room_u_list[temp_serial] is null');
    	}
	
	
    //  계정 삭제(임시 위치입니다.) 
    var index = findIndex(temp_serial);
    serial_list.splice(index,1);
  	delete client_list[temp_serial];
  	
  	// print();

  	}
	else {
		console.log('[err] disconnectUser : temp_serial is null');
  	}	
}




// ids index 찾기
function findIndex(temp){
  var index = null;
  for (var cur_index in serial_list) {
    if (serial_list[cur_index] == temp) {
      index = cur_index;
    }
  }
  return index;
}

function print(){
  console.log('serial_list');
  console.log(serial_list);
  console.log('client_list');
  console.log(client_list);
  console.log('room_u_list');
  console.log(room_u_list);
  console.log('room_m_list');
  console.log(room_m_list);
}
