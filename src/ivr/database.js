
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
				if (res.rows.length==0){
					console.log("null");
					reject(res);
				}
				else{
					console.log("non-null");
					resolve(res.rows[0]);
				}
			});
		});
	}
	addUser: function(phonenumber,callback){
		queryStr='insert into users (phonenumber,status) values (\''+phonenumber+'\',\'in use\')';
		console.log(queryStr);
		pool.query(queryStr,(err,res)=>{
			if (err){
				console.log("error from addUser");
			}
			callback(res);
		});
		
	},
	getAvailableUsers: function(callback){
		queryStr='select * from (select * from users where status=\'available\' and now()>=starttime and now()<=endtime) order by random()';
		console.log(queryStr);
		pool.query(queryStr,(err,res)=>{
			console.log("in getAvailableUsers, before callback");
			console.log("result length, in getAvailableUsers: "+res.rows.length);
			callback(res.rows);
			console.log("in getAvailableUsers, after callback");

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
		queryStr='update users set status=\''+statusValue+'\' where id='+id;
		console.log(queryStr);
		pool.query(queryStr,(err,res)=>{
			if (err){
				console.log("error from updateUserStatus");
			}
			else{
				callback(res);
			}
		});
	}
	
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