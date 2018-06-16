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
	console.log("/welcome_promise change log message: sid "+sid);
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
		console.log("/welcome_promise: value ",value);
		if (params.id==null){
			params.id=value['id'];
			params.exitStatus=value['exitstatus'];
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
  //the call to db.getRandomAvailableUser() should be moved to handler
  //because we need to be able to call it again when a potential host rejects call
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
	console.log("/callHost: req.query properties: "+JSON.stringify(req.query));
	var params=handler.getArrayFromGetRequest(req,'params');
	console.log("/ivr/callHost: params "+JSON.stringify(params));
	
	
	const conferenceName=params.conferenceName;
	const guestId=params.id;
	const hostId=params.hostId;
	const guestCallSid=params.sid;
	const hostCallSid=req.query.CallSid;
	db.addConnection(guestId,hostId,guestCallSid,hostCallSid,conferenceName)
	.then(val=>{
		connectionId=val.rows[0]['id'];
		console.log("/ivr/callHost: id of new connection "+connectionId);
		params.connectionId=connectionId;
		console.log("/ivr/callHost: hostId "+hostId);
		console.log("/ivr/callHost: conferenceName "+conferenceName);
		res.send(handler.callHost(params));
	});
	
});

// GET: /ivr/handleHostResponseToOfferedGuest
router.get('/handleHostResponseToOfferedGuest',(req,res)=>{
	var digits=req.query.Digits;
	var conferenceName=req.query.conferenceName;
	var params=handler.getArrayFromGetRequest(req,'params');
	console.log("/ivr/handleHostResponseToOfferedGuest: params "+JSON.stringify(params));
	
	res.send(handler.handleHostResponseToOfferedGuest(digits,params));
});




//different possible host statuses
//requested
//accepted
//completed

router.get('/statusChange',(req,res)=> {
	console.log("/statusChange: req.query "+JSON.stringify(req.query));
	status=req.query.CallStatus;
	console.log("/statusChange: status has changed to "+req.query.CallStatus);
	console.log("/statusChange: call came from "+req.query.Caller);
	
	//should this only happen if incoming status is 'completed'?  when else
	//would we update the user status?

	//todo: how do we detect that a potential host has rejected their offer?
	//action will be performed in handleHostResponseToOfferedGuest
	//but now I'm thinking it should be handled here, with a db select from connectionLog
	//(see comments in handleHostResponseToOfferedGuest)
	
	//todo: determine how to differentiate between:
	//1. host receives call, accepts, then exits during call
	//2. host receives call, accepts, completes, makes guest call, then exits during call
	//maybe we get the highest number id where this sid is either hostCallSid or guestCallSid,
	//then set isHost=(sid==hostCallSid)
	
	if (req.query.From==process.env.TWILIO_PHONE_NUMBER){
		phonenumber=req.query.To;
	}
	else{
		phonenumber=req.query.From;
	}
	
	hostCallSid=req.query.CallSid;
	console.log("/statusChange: hostCallSid "+hostCallSid);
	
	if (status=="completed"){
	
		db.getConnectionByHostCallSid(hostCallSid)
		.then(connection=>{
			console.log("/statusChange: reached getConnectionByHostCallSid then");
			console.log("/statusChange: connection "+JSON.stringify(connection));
			
			hoststatus=connection.rows[0]["hoststatus"];
			console.log("/statusChange: hoststatus "+hoststatus);
			guestCallSid=connection.rows[0]["guestCallSid"];
			hostCallSid=connection.rows[0]["hostCallSid"];
			console.log("/statusChange: guestCallSid "+guestCallSid);
			console.log("/statusChange: hostCallSid "+hostCallSid);
			
			if (hoststatus=="requested"){
				
				console.log("/statusChange: host refused, going to call another");
				db.getRandomAvailableUser().then(value=>{
					hostPhoneNumber=value.rows[0].phonenumber;
					hostId=value.rows[0].id;
					console.log("/statusChange: hostPhoneNumber "+hostPhoneNumber);
					console.log("/statusChange: hostId "+hostId);
					
					//let's just pretend that we have params accessible somehow (e.g. database call)
					//and mock up a set to test the createCallToHost here
					//todo: eventually we will need to replace this with actual params access
					
					var params={};
					params.id=connection.rows[0]["guestuserid"];
					params.sid=guestCallSid;
					//here we need to use params.id
					params.phonenumber=process.env.GVOICE_PHONE_NUMBER; 
					
					
					params.hostPhoneNumber=hostPhoneNumber;
					params.hostId=hostId;
					handler.createCallToHost(params);
					//todo: how are we going to update the guest's params with the new values of hostPhoneNumber and hostId?
					//maybe after all that, we actually need to have params implemented in a database table
					//so that we can update them here with a db call and then have them be accessible to the guest
					//the next time the guest requests their own params;
					//todo: big problem here, guest params are not sent to statusChange;
					//that means we will definitely need a database solution or some other kind of globally accessible session
					
				},error=>{
					console.log("/menu: error "+error.toString());
					responseTwiml=handler.noHostAvailable(params);
					res.send(responseTwiml);
				});
			}
			else if (hoststatus=="accepted"){
				
			}
		})
		.catch(err=>{
			console.log("/statusChange: getConnectionByHostCallSid error "+err.toString());
		});	

		db.updateUserStatusToExitStatusFromPhoneNumber(phonenumber).then(value=>{
			sendValue=handler.statusChange(status);
			if (sendValue!=null){
				res.send(sendValue);
			}
		});
	}
	
});

router.get('/statusChangeConference',(req,res)=>{
	
	console.log("/statusChangeConference: req.query properties: "+JSON.stringify(req.query));
	
	status=req.query.StatusCallbackEvent;
	callSid=req.query.CallSid;
	//note that FriendlyName is capitalized as this incoming parameter
	//but friendlyName as a property of conference when retrieved via client.conferences()
	friendlyName=req.query.FriendlyName;
	
	//todo: how are we going to deal with the fact that this conference status changes
	//every time a guest goes to the conference menu by pressing "*"?
	switch(status){
		case "participant-join":
			db.updateConnection(callSid,'accepted')
			.catch(err=>{
				console.log("/statusChangeConference participant-join: error "+err.toString());
			});
		
			break;
		case "participant-leave":
			break;
	}
	
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
	console.log("/ivr/conferenceControl: about to modify other participants");
	handler.modifyOtherConferenceParticipants(params,process.env.PHONETREETESTER_URL+'ivr/waitForConferenceControlReturn');
});

router.get('/waitForConferenceControlReturn',(req,res)=>{
	var params=handler.getArrayFromGetRequest(req,'params');
	console.log("/ivr/waitForConferenceControlReturn: params "+JSON.stringify(params));
	
	//todo: this is where the other user gets sent if one of the users hangs up, so need to check first
	//that the other user hasn't hung up, maybe by checking params.hostCallSid in connection table
	//hopefully it will be updated before this function is called?  maybe instead we should check Twilio's Calls collection
	
	
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
			responseStr=handler.addConferenceToResponse(response,params,false);
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
