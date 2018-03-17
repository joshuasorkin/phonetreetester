/*
const {Client}=require('pg');

const pgclient=new Client({
	connectionString:process.env.DATABASE_URL,
	ssl:true
});

pgclient.connect();
	
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

getUser('+19991112222', function(err, user) {
    if (err) throw err;
    if (user==null){
        console.log("user not found");
    }
    else {
        console.log(user["phonenumber"]);
    }
});
*/







var db=require('./src/ivr/database');

/*
db.getUser('+19991112222', function(err, user) {
    if (err) throw err;
    if (user==null){
        console.log("user not found");
    }
    else {
        console.log(user["phonenumber"]);
    }
});
*/

//testGetUser('+15105551337');
//testGetUser('+12348290823');
//db.destruct();

var number=Math.floor(Math.random()*90000) + 10000;
db.testFromSite();
//testGetAvailableUsers();
//testGetAllUsers();

function testAddUser(phonenumber){
	db.addUser(phonenumber).then(val=>{console.log(JSON.stringify(val.rows[0]))});
}

function testGetAvailableUsers(){
	db.getAvailableUsers(function(result){
		console.log("running callback function that was passed to getAvailableUsers");
		console.log("result length: "+result.length);
		result.forEach(function(element){
			console.log("logging element");
			console.log(JSON.stringify(element));
		});
	});
}

function testGetAllUsers(){
	db.getAllUsers(function(result){
		console.log("running callback function that was passed to getAllUsers");
		console.log("result length: "+result.length);
		result.forEach(function(element){
			console.log("logging element");
			console.log(JSON.stringify(element));
		});
	});
}


function testGetUser(phonenumber){
	db.getUser(phonenumber,function(user){
		if (user==null){
			console.log("user not found");
		}
		else{
			console.log(user["phonenumber"]);
		}
	});
}