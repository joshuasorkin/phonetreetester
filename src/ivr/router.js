//todo: many of the exported functions from handler are used inside the digit-processing switch blocks,
//so if those blocks get moved to handler.js then we no longer need to export those functions

const Router = require('express').Router;	
const handler=require('./handler');
var bodyParser = require('body-parser');
var db=require('./database');

const router = new Router();
router.use(bodyParser.urlencoded({ extended: false }));


// POST: /ivr/welcome
router.post('/welcome', (req, res) => {
	
	const fromNum=req.body.From;
	const sid=req.body.CallSid;
	console.log("/welcome: sid "+sid);
	res.send(handler.welcome(fromNum,sid));
});

// POST: /ivr/welcome_promise
router.post('/welcome_promise',(req,res) => {
	const fromNum=req.body.From;
	const sid=req.body.CallSid;
	console.log("/welcome_promise: sid "+sid);
	var user;
	var params={};
	params.id=null;
	params.sid=sid;
	params.phonenumber=fromNum;
	console.log("/welcome_promise: phonenumber "+params.phonenumber);
	db.getUser_promise(fromNum).then(value=>{
		console.log("/welcome_promise: first then");
		if(value!=null){
			user=value;
			params.id=value.id;
			console.log("/welcome_promise: id "+params.id);
			params.exitStatus=value.status;
			console.log("/welcome_promise: exitStatus "+params.exitStatus);
			return db.updateUserExitStatus(params.exitStatus,params.id);
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
		if (params.id==null){
			params.id=value.rows[0]['id'];
			params.exitStatus=value.rows[0]['exitstatus'];
			console.log("/welcome_promise: setting id from null to "+params.id);
		}
		console.log("/welcome_promise: id from getUser/addUser: "+params.id);
		console.log("/welcome_promise: updating user status to in use");
		return db.updateUserStatus("in use",params.id);
	}).then(value=>{
		//testing handler master object
		preMainMenuGather=handler.buildPreMainMenuGather(params);
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
  //var params=JSON.parse(req.query['params']);
  var params=handler.getArrayFromGetRequest(req,'params');
  console.log("/ivr/menu: params "+JSON.stringify(params));
  
  console.log("/ivr/menu: digit "+digit);
  console.log("/ivr/menu: sid "+params.sid);
  var responseTwiml;
  
  //maybe best to move this whole switch block into handler,
  //since it's focused on rendering the correct responseTwiml
  //and then that way it can be called directly to build twiml that "returns to main menu",
  //as opposed to needing to make a GET request whenever we want to get the twiml resulting from processing a digit choice
  //although I guess we have to do that anyways if it results from a <gather>
  switch(digit){
	case '1':
		console.log("menu: chose 1");
		db.getRandomAvailableUser().then(value=>{
			hostPhoneNumber=value.rows[0].phonenumber;
			hostId=value.rows[0].id;
			console.log("/menu: hostPhoneNumber "+hostPhoneNumber);
			console.log("/menu: hostId "+hostId);
			params.hostPhoneNumber=hostPhoneNumber;
			params.hostId=hostId;
			responseTwiml=handler.guestCallsHost(params);
			res.send(responseTwiml);
		},error=>{
			console.log("/menu: error "+error.toString());
			responseTwiml=handler.noHostAvailable(params);
			res.send(responseTwiml);
		})
		//responseTwiml=guestCallsHost(sid);
		break;
	case '2':
		handler.switchHostStatus(params).then(value=>{
			console.log('/ivr/menu: .then value for switchHostStatus: ');
			console.log(value);
			res.send(value);
		});
		break;
	case '3':
		res.send(handler.exitTwiml());
		break;
		
	default:
		responseTwiml=handler.preMainMenuGatherWithError(params);
		res.send(responseTwiml);
		break;
  }
  
  
});

// GET: /ivr/callHost
router.get('/callHost', (req, res) => {
	console.log("reached callHost endpoint");
	var params=handler.getArrayFromGetRequest(req,'params');
	console.log("/ivr/callHost: params "+JSON.stringify(params));
	
	
	const conferenceName=params.conferenceName;
	const hostId=params.hostId;
	console.log("/ivr/callHost: hostId "+hostId);

	console.log("/ivr/callHost: conferenceName "+conferenceName);
	res.send(handler.callHost(params));
});

// GET: /ivr/handleHostResponseToOfferedGuest
router.get('/handleHostResponseToOfferedGuest',(req,res)=>{
	var digits=req.query.Digits;
	var conferenceName=req.query.conferenceName;
	var params=handler.getArrayFromGetRequest(req,'params');
	console.log("/ivr/handleHostResponseToOfferedGuest: params "+JSON.stringify(params));
	
	res.send(handler.handleHostResponseToOfferedGuest(digits,params));
});





router.get('/statusChange',(req,res)=> {
	status=req.query.CallStatus;
	console.log("/statusChange: status has changed to "+req.query.CallStatus);
	console.log("/statusChange: call came from "+req.query.Caller);
	db.updateUserStatusToExitStatusFromPhoneNumber(req.query.Caller).then(value=>{
		sendValue=handler.statusChange(status);
		if (sendValue!=null){
			res.send(sendValue);
		}
	});
	
});

router.get('/statusChangeConference',(req,res)=>{
	status=req.query.StatusCallbackEvent;
	//note that FriendlyName is capitalized as this incoming parameter
	//but friendlyName as a property of conference when retrieved via client.conferences()
	friendlyName=req.query.FriendlyName;
	
	/*
	if (status=="participant-join"){
		handler.listConferences(friendlyName);
	}
	*/
	
	console.log("/statusChangeConference: status has changed to "+status);
	sendValue=handler.statusChangeConference(status);
	if (sendValue!=null){
		res.send(sendValue);
	}
});

router.get('/conferenceControl',(req,res)=>{
	var params=handler.getArrayFromGetRequest(req,'params');
	console.log("/ivr/conferenceControl: params "+JSON.stringify(params));
	res.send(handler.conferenceControl(params,false));
	//console.log("/ivr/conferenceControl: about to modify other participants");
	//handler.modifyOtherConferenceParticipants(params,process.env.PHONETREETESTER_URL+'ivr/waitForConferenceControlReturn');
});

router.get('/waitForConferenceControlReturn',(req,res)=>{
	var params=handler.getArrayFromGetRequest(req,'params');
	console.log("/ivr/waitForConferenceControlReturn: params "+JSON.stringify(params));
	res.send(handler.messageOtherUserAboutConferenceControl(params));
});

router.get('/handleResponseToConferenceControl',(req,res)=>{
	var params=handler.getArrayFromGetRequest(req,'params');
	console.log("/ivr/handleResponseToConferenceControl: params "+JSON.stringify(params));
	digit=req.query.Digits;
	conferenceName=params.conferenceName;
	sid=params.sid;
	var response=null;
	var responseStr;
	//todo: move this switch block into handler.js
	switch (digit){
		case '1':
			responseStr=handler.addConferenceToResponse(response,params);
			break;
		case '2':
			responseStr=handler.buildPreMainMenuGather(params);
			console.log("/handleResponseToConferenceControl: about to redirectParticipantsToMainMenu");
			handler.modifyOtherConferenceParticipants(params,process.env.PHONETREETESTER_URL+'ivr/postConference');
			break;
		default:
			responseStr=handler.conferenceControl(params,true);
	}
	console.log("/handleResponseToConferenceControl: responseStr "+responseStr);
	res.send(responseStr);
});

router.get('/wait',(req,res)=>{
	res.send(handler.wait());
});

router.get('/postConference',(req,res)=>{
	var params=handler.getArrayFromGetRequest(req,'params');
	console.log("/ivr/postConference: params "+JSON.stringify(params));
	res.send(handler.postConference(params));
});

module.exports = router;
