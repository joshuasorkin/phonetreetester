const Router = require('express').Router;
const {
	welcome, 
	menu, 
	callHost, 
	handleHostResponseToOfferedGuest,
	buildPreMainMenuGather,
	noHostAvailable,
	guestCallsHost,
	statusChange,
	statusChangeConference,
	switchHostStatus,
	exitTwiml,
	conferenceControl,
	planets} = require('./handler');
var bodyParser = require('body-parser');
var db=require('./database');

const router = new Router();
router.use(bodyParser.urlencoded({ extended: false }));


// POST: /ivr/welcome
router.post('/welcome', (req, res) => {
	
	const fromNum=req.body.From;
	const sid=req.body.CallSid;
	console.log("/welcome: sid "+sid);
	res.send(welcome(fromNum,sid));
});

// POST: /ivr/welcome_promise
router.post('/welcome_promise',(req,res) => {
	const fromNum=req.body.From;
	const sid=req.body.CallSid;
	console.log("/welcome_promise: sid "+sid);
	var user;
	var exitStatus;
	var id=null;
	db.getUser_promise(fromNum).then(value=>{
		console.log("/welcome_promise: first then");
		if(value!=null){
			user=value;
			id=value.id;
			console.log("/welcome_promise: id "+id);
			exitStatus=value.status;
			console.log("/welcome_promise: exitStatus "+exitStatus);
			return db.updateUserExitStatus(exitStatus,id);
		}
		else{
			console.log("/welcome_promise: about to add user");
			return db.addUser(fromNum);
		}
	},error=>{
		console.log("/welcome_promise: error first then");
		console.log("/welcome_promise: "+error.toString());	
	}).then(value=>{
		console.log("/welcome_promise: second then");
		console.log("/welcome_promise: value ",value.rows[0]);
		if (id==null){
			id=value.rows[0]['id'];
			exitStatus=value.rows[0]['exitstatus'];
			console.log("/welcome_promise: setting id from null to "+id);
		}
		console.log("/welcome_promise: id from getUser/addUser: "+id);
		console.log("/welcome_promise: updating user status to in use");
		return db.updateUserStatus("in use",id);
	}).then(value=>{
		preMainMenuGather=buildPreMainMenuGather(sid,exitStatus,id);
		console.log("/welcome_promise: preMainMenuGather "+preMainMenuGather);
		res.send(preMainMenuGather);		
	}).catch(x=>{
		console.log("/welcome_promise: outside catch block")
		console.log("/welcome_promise: "+x.toString());
	});
});


// GET: /ivr/menu
router.get('/menu', (req, res) => {
  const digit = req.query.Digits;
  //const sid=req.query.sid;
  //const userId=req.query.userId;
  //const exitStatus=req.query.exitStatus;
  var params=JSON.parse(req.query['params']);
  
  console.log("/ivr/menu: params "+JSON.stringify(params));
  
  console.log("/ivr/menu: digit "+digit);
  console.log("/ivr/menu: sid "+params.sid);
  var responseTwiml;
  switch(digit){
	case '1':
		console.log("menu: chose 1");
		db.getRandomAvailableUser().then(value=>{
			hostPhoneNumber=value.rows[0].phonenumber;
			hostID=value.rows[0].id;
			console.log("/menu: hostPhoneNumber "+hostPhoneNumber);
			console.log("/menu: hostID "+hostID);
			//actual value of hostPhoneNumber will be used here in production
			responseTwiml=guestCallsHost(params.sid,null,value.rows[0].id);
			res.send(responseTwiml);
		},error=>{
			console.log("/menu: error "+error.toString());
			responseTwiml=noHostAvailable(sid);
			res.send(responseTwiml);
		})
		//responseTwiml=guestCallsHost(sid);
		break;
	case '2':
		switchHostStatus(exitStatus,params.sid,params.userId).then(value=>{
			console.log('/ivr/menu: .then value for switchHostStatus: ');
			console.log(value);
			res.send(value);
		});
		break;
	case '3':
		res.send(exitTwiml());
		break;
		
	//default:
	//	responseTwiml=redirectWelcome();
	//	break;
  }
  
  
  //res.send(menu(digit,sid));
  //return res.send(welcome(sid));
});

// GET: /ivr/callHost
router.get('/callHost', (req, res) => {
	console.log("reached callHost endpoint");
  const conferenceName=req.query.conferenceName;
  const hostID=req.query.hostId;
  console.log("/ivr/callHost: hostID "+hostID);
  
  console.log("/ivr/callHost: conferenceName "+conferenceName);
  res.send(callHost(conferenceName));
});

// GET: /ivr/handleHostResponseToOfferedGuest
router.get('/handleHostResponseToOfferedGuest',(req,res)=>{
	var digits=req.query.Digits;
	var conferenceName=req.query.conferenceName;
	
	res.send(handleHostResponseToOfferedGuest(digits,conferenceName));
});

router.get('/statusChange',(req,res)=> {
	status=req.query.CallStatus;
	console.log("/statusChange: status has changed to "+req.query.CallStatus);
	console.log("/statusChange: call came from "+req.query.Caller);
	db.updateUserStatusToExitStatusFromPhoneNumber(req.query.Caller).then(value=>{
		sendValue=statusChange(status);
		if (sendValue!=null){
			res.send(sendValue);
		}
	});
	
});

router.get('/statusChangeConference',(req,res)=>{
	status=req.query.StatusCallbackEvent;
	console.log("/statusChangeConference: status has changed to "+status);
	sendValue=statusChangeConference(status);
	if (sendValue!=null){
		res.send(sendValue);
	}
});

router.get('/conferenceControl',(req,res)=>{
	conferenceName=req.query.conferenceName;
	res.send(conferenceControl(conferenceName));
});

router.get('/handleResponseToConferenceControl',(req,res)=>{
	digit=req.query.Digits;
	conferenceName=req.query.conferenceName;
	response=new VoiceResponse();
	var responseStr;
	switch (digit){
		case '1':
			addConferenceToResponse(response,conferenceName);
			responseStr=response.toString();
			break;
		case '2':
			responseStr=buildPreMainMenuGather(sid,exitStatus,id);
			redirectParticipantsToMainMenu(conferenceName);
			break;
	}
	res.send(responseStr);
});


module.exports = router;
