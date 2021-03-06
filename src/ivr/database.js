


const {Pool,Client}=require('pg');

const pool=new Pool({
	connectionString:process.env.HEROKU_POSTGRESQL_OLIVE_URL,
	ssl:true
});

module.exports = {
	getUser: function(phonenumber,callback){
		queryStr='SELECT * FROM users where phonenumber=\''+phonenumber+'\';';
		console.log(queryStr);
		pool.query(queryStr,(err,res)=>{
			if (res.rows.length==0){
				console.log("null");
				callback(null);
			}
			else{
				console.log("non-null");
				callback(res.rows[0]);
			}
		});
	},
	getUser_promise: function(phonenumber){
		return new Promise(function(resolve,reject){
			queryStr='SELECT * FROM users where phonenumber=\''+phonenumber+'\';';
			console.log(queryStr);
			pool.query(queryStr,(err,res)=>{
				if (err){
					console.log("getUser_promise error: "+err.toString());
					reject(err);				}
				else if (res.rows.length==0){
					console.log("getUser_promise: null, need to add user");
					resolve(null);
				}
				else{
					console.log("getUser_promise: non-null");
					console.log("getUser_promise: result " + JSON.stringify(res.rows[0]));
					resolve(res.rows[0]);
				}
			});
		});
	},
	addUser: function(phonenumber){
		return new Promise(function(resolve,reject){
			queryStr='insert into users (phonenumber,status,exitStatus) values (\''+phonenumber+'\',\'in use\',\'in use\') returning *';
			console.log(queryStr);
			pool.query(queryStr,(err,res)=>{
				if (err){
					console.log("addUser: error "+err.toString());
					reject(err);
				}
				else{
					console.log("addUser: success");
					console.log("addUser: res "+res.rows[0]);
					resolve(res);
				}
			});
		});
		
	},
	addConnection: function(guestUserId,hostUserId,guestCallSid,
							hostCallSid,conferenceName){
		return new Promise(function(resolve,reject){
			queryStr='insert into connection (guestUserId,hostUserId,guestCallSid,hostCallSid,conferenceName,hoststatus) values ($1,$2,$3,$4,$5,$6) returning *';
			console.log("addConnection: queryStr "+queryStr);
			pool.query(queryStr,
			[guestUserId,hostUserId,guestCallSid,hostCallSid,conferenceName,'requested'],
			(err,res)=>{
				if (err){
					console.log("addConnection: error "+err.toString());
					reject(err);
				}
				else{
					console.log("addConnection: success");
					console.log("addConnection: res "+res.rows[0]);
					resolve(res);
				}
			});
		});
		
	},
	getConnectionByHostCallSid: function(hostCallSid){
		
		return new Promise(function(resolve,reject){
			queryStr='select * from connection where hostCallSid=\''+hostCallSid+'\'';
			console.log("getConnectionByHostCallSid: queryStr "+queryStr);
			pool.query(queryStr,
			(err,res)=>{
				if (err){
					console.log("getConnectionByHostCallSid: error "+err.toString());
					reject(err);
				}
				else{
					console.log("getConnectionByHostCallSid: success");
					console.log("getConnectionByHostCallSid: res "+res.rows[0]);
					resolve(res);
				}
			});
		});
		
	},
	
	
	getActiveConnectionByCallSid: function(CallSid){
		
	},
	
	
	updateConnection: function(callSid,connectionStatus){
		queryStr='update connection set hoststatus=\''+connectionStatus+'\' where hostCallSid=\''+callSid+'\' returning *';
		return update(queryStr,"updateConnection");
		
		
		/*
		return new Promise(function(resolve,reject){
			
			console.log("updateConnectionIfHostJoined: queryStr "+queryStr);
			pool.query(queryStr,
			(err,res)=>{
				if (err){
					console.log("updateConnectionIfHostJoined: error "+err.toString());
				}
				else{
					console.log("updateConnectionIfHostJoined: success");
					console.log("updateConnectionIfHostJoined: res "+res.rows[0]);
					resolve(res);
				}
			});
		});
		*/
	},
	
	
	
	getRandomAvailableUser: function(){
		return new Promise(function(resolve,reject){
			//queryStr='select * from (select * from users where status=\'available\' and now()>=starttime and now()<=endtime) order by random()';
			queryStr='select * from (select * from users where status=\'available\') x order by random() limit 1;';
			console.log(queryStr);
			pool.query(queryStr,(err,res)=>{
				console.log("result length, in getAvailableUsers: "+res.rows.length);
				if (res.rows.length==0){
					console.log("getAvailableUsers: no rows returned");
					reject(res);
				}
				else{
					console.log("getAvailableUsers: rows returned");
					resolve(res);
				}

			});
		});
	},
	getAllUsers: function(callback){
		queryStr='select * from users';
		console.log(queryStr);
		pool.query(queryStr,(err,res)=>{
			console.log("in getAllUsers, before callback");
			console.log("result length, in getAllUsers: "+res.rows.length);
			callback(res.rows);
			console.log("in getAllUsers, after callback");

		});
	},
	updateUserStatus: function(statusValue,id,callback){
		queryStr='update users set status=\''+statusValue+'\' where id='+id+' returning *';
		return update(queryStr,"updateUserStatus");
		
		/*
		console.log(queryStr);
		return new Promise(function(resolve,reject){
			pool.query(queryStr,(err,res)=>{
				if (err){
					console.log("updateUserStatus: error "+err.toString());
					reject(res);
				}
				else{
					console.log("updateUserStatus: success");
					resolve(res);
				}
			});
		});
		*/
	},
	updateUserExitStatus: function(exitStatusValue,id){
		queryStr='update users set exitStatus=\''+exitStatusValue+'\' where id='+id+' returning *';
		return update(queryStr,"updateUserExitStatus");
		
		/*
		console.log(queryStr);
		return new Promise(function(resolve,reject){
			pool.query(queryStr,(err,res)=>{
				if (err){
					console.log("updateUserExitStatus: error "+err.toString());
					reject(res);
				}
				else{
					console.log("updateUserExitStatus: success");
					resolve(res);
				}
			});
		});
		*/
	},
	updateUserStatusToExitStatusFromPhoneNumber: function(phonenumber){
		queryStr='update users set status=exitStatus where phonenumber=\''+phonenumber+'\'';
		return update(queryStr,"updateUserStatusToExitStatusFromPhoneNumber");
		
		/*
		console.log(queryStr);
		return new Promise(function(resolve,reject){
			pool.query(queryStr,(err,res)=>{
				if (err){
					console.log("updateUserExitStatus: error "+err.toString());
					reject(res);
				}
				else{
					console.log("updateUserExitStatus: success");
					resolve(res);
				}
			});
		});
		*/
	},
	testFromSite:function(){
		var number=Math.floor(Math.random()*90000) + 10000;
		const text = 'INSERT INTO users(phonenumber,status) VALUES($1, $2) RETURNING *'
		const values = [number, 'available'];

		// promise
		pool.query(text, values)
		  .then(res => {
			console.log(res.rows[0])
		  })
		  .catch(e => console.error(e.stack))
	}
	
	
}




function update(sql,functionName){
	console.log(sql);
	return new Promise(function(resolve,reject){
			pool.query(sql,(err,res)=>{
				if (err){
					console.log(functionName+": error "+err.toString());
					reject(res);
				}
				else{
					console.log(functionName+": non-null");
					console.log(functionName+": result "+JSON.stringify(res.rows[0]));
					resolve(res.rows[0]);
				}
			});
		});
}


/*
function getUser(phonenumber, callback){
	queryStr='SELECT * FROM users where phonenumber=\''+phonenumber+'\';';
	console.log("queryStr: "+queryStr);  
	pgclient.query(queryStr)
		.then(res => {
			console.log("query running");
			console.log("rows length "+res.rows.length);
			if (res.rows.length==0){
				return null;
			}
			else{
				return res.rows[0];
			}
		})
		.catch(err=>console.error(err.stack));
}			




function destruct(){
	pgclient.end();
}
*/

//module.exports.getUser=getUser;
//module.exports.destruct=destruct;