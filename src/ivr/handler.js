//so if i understand the handler structure,
//what we are doing is: export functions that are decision points
//so that we can redirect to them
//or maybe it's that we export functions that end with the need to send POST request
//back to the router
//so how should we handle the client.calls.create() request?  seems like this breaks the
//router/handler abstraction

//todo: refactor methods like buildGetUrl() and sayAlice() into SRO-observant files/classes
//todo: remove versions from source control containing hyperspacecraft.net references, freesound.org, and phone numbers (use '[+]\d{10}' regex)

//todo: add authorization checking, so only requests from twilio will be processed--can I do that systemwide?

const VoiceResponse = require('twilio').twiml.VoiceResponse;
const client=require('twilio')(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN
);
var request = require('request');
const languageConfig="en-AU";
//var db=require('./src/ivr/database');
var db=require('./database');
const {Pool,Client}=require('pg');
const pool=new Pool({
	connectionString:process.env.HEROKU_POSTGRESQL_OLIVE_URL,
	ssl:true
});
//const waitSoundUrl='http://twimlets.com/holdmusic?Bucket=com.twilio.music.electronica';
const waitSoundUrl='http://hyperspacecraft.net//Sheena%20Easton%20-%20Telephone%20HQHD.mp3';
//const waitSoundUrl='https://freesound.org/data/previews/86/86684_1390811-lq.mp3';
const waitUrl=process.env.PHONETREETESTER_URL+'ivr/wait';
const querystring=require('querystring');


exports.welcome = function welcome(fromNum,sid) {

	//begin non-promise version
	/*
	console.log("welcome: fromNum is "+fromNum);
  console.log("welcome: sid is "+sid);
  
  const voiceResponse = new VoiceResponse();
  //const bodyUrl = '';

  params={'sid':sid}
  url=buildGetUrl('/ivr/menu',params);
  
  const gather = voiceResponse.gather({
	action: url,
	numDigits: '1',
	method: 'GET',
	timeout: 10
  });
	sayAlice(gather,languageConfig,"Welcome to Vent.  Press 1 to call a host.  Press 2 to set your own host interval.");
  //gather.play({loop: 3}, bodyUrl);

  responseStr=voiceResponse.toString();
  return responseStr;
  */
  //end non-promise version
  
  
	var userInitialStatus;

	
	
	/*
  db.getUser(fromNum,function(row){
	  var result;
	  if(row==null){
		db.addUser(fromNum,function(result){
			console.log(result.toString());
		})
	  }
	  else{
		  userInitialStatus=row['status'].toString();
		  console.log('welcome: userInitialStatus '+userInitialStatus);
	  }
	  return row
  }).then(function(result){
		  return buildPreMainMenuGather(sid);});
		  */
	
	queryStr='SELECT * FROM users where phonenumber=\''+fromNum+'\';'
	console.log()
	pool.query('SELECT * FROM users where phonenumber=\''+fromNum+'\';')
	.then(res=>{
		console.log('welcome: getUser result: '+JSON.stringify(res.rows[0]));
	})
	.catch(err=>{
		console.log('welcome: error '+err.stack);
	});
	console.log('welcome: this line comes after promise');
	return buildPreMainMenuGather(sid);
  
};

exports.buildPreMainMenuGather=function buildPreMainMenuGather(params){
	var voiceResponse = new VoiceResponse();
	
	console.log("buildPreMainMenuGather: params "+JSON.stringify(params));

	/*
	params={'sid':sid}
	url=buildGetUrl('/ivr/menu',params);

	const gather = voiceResponse.gather({
		action: url,
		numDigits: '1',
		method: 'GET',
		timeout: 10
	});
	sayAlice(gather,languageConfig,"Welcome to Vent.  Press 1 to call a host.  Press 2 to set your own host interval.");
	//gather.play({loop: 3}, bodyUrl);
	*/
	
	addPreMainMenuGather(voiceResponse,params);

	responseStr=voiceResponse.toString();
	return responseStr;
	
}

exports.preMainMenuGatherWithError=function preMainMenuGatherWithError(params){
	var response=new VoiceResponse();
	sayAlice(response,languageConfig,"Sorry, that's not a valid option.");
	addPreMainMenuGather(response,params);
	return response.toString();
}


function addArrayToGetRequest(url,paramArray,paramArrayName){
	return url+"?"+querystring.stringify({[paramArrayName]:JSON.stringify(paramArray)});
}

exports.getArrayFromGetRequest=function(req,paramArrayName){
	return JSON.parse(req.query[paramArrayName]);
}

//should change this so that we're passing in a 'user' parameter that is the array of parameters.
//maybe this indicates that a standardized user params data structure would be helpful.
//need to decide on schema: what are all the properties that would be useful for a 'user' array?
function addPreMainMenuGather(voiceResponse,params){
	//url=buildGetUrl('/ivr/menu',params);
	url=addArrayToGetRequest('/ivr/menu',params,'params');
	
	console.log("addPreMainMenuGather: url "+url);

	const gather = voiceResponse.gather({
		action: url,
		numDigits: '1',
		method: 'GET',
		timeout: 10
	});
	sayAlice(gather,languageConfig,"Welcome to Vent.  Your current host status is.  \""+params.exitStatus+"\".  Press 1 to call a host.  Press 2 to change host status.  Press 3. Or hang up. To exit.");
	//gather.play({loop: 3}, bodyUrl);
	
}

exports.switchHostStatus=function switchHostStatus(params){
	return new Promise(function(resolve,reject){
		var exitStatusToSet;
		switch(params.exitStatus){
			case 'available':
				exitStatusToSet="in use";
				break;
			case 'in use':
				exitStatusToSet="available";
				break;
		}
		console.log("switchHostStatus: before calling updateUserExitStatus");
		db.updateUserExitStatus(exitStatusToSet,params.id).then(value=>{
			console.log("switchHostStatus: .then after calling updateUserExitStatus");
			params.exitStatus=exitStatusToSet;
			preMainMenuGather=exports.buildPreMainMenuGather(params);
			console.log("switchHostStatus: about to resolve()");
			resolve(preMainMenuGather);
		}).catch(error=>{
			console.log("switchHostStatus: error "+error.toString());
			reject(error);
		});
	});

}

exports.exitTwiml=function exitTwiml(){
	response=new VoiceResponse();
	sayAlice(response,languageConfig,"Thank you for using Vent.  It was a pleasure interacting with you.  Goodbye!");
	response.hangup();
	str=response.toString();
	console.log("exitTwiml: str "+str);
	return str;
}

/*
exports.menu = function menu(digit,sid,userId,exitStatus) {
	console.log("menu: starting");
	console.log("menu: digit "+digit);
  var responseTwiml;
  switch(digit){
	case '1':
		console.log("menu: chose 1");
		responseTwiml=guestCallsHost(sid);
		break;
	case '2':
		responseTwiml=switchHostStatus(exitStatus,sid,userId);
		break;
	case '3':
		responseTwiml=exitTwiml();
	//default:
	//	responseTwiml=redirectWelcome();
	//	break;
  }
  return responseTwiml;
};
*/

exports.statusChange=function statusChange(status){
	console.log("statusChange: status "+status);
	switch(status){
		case 'initiated':
			break;
		case 'ringing':
			break;
		case 'answered':
			break;
		case 'completed':
			break;
		default:
			console.log("statusChange: unrecognized status "+status);
			break;
	}
	voiceResponse=new VoiceResponse();
	voiceResponse.say("status change");
	return voiceResponse.toString();
}


exports.statusChangeConference=function statusChangeConference(status){
	console.log("statusChangeConference: status "+status);
	voiceResponse=new VoiceResponse();
	voiceResponse.say("status change conference");
	return voiceResponse.toString();
	/*
	switch(status){
		case 'participant-join':
			break;
		case 'ringing':
			break;
		case 'answered':
			break;
		case 'completed':
			break;
		default:
			console.log("statusChange_conference: unrecognized status "+status);
			break;
	}
	*/
	
	
}



exports.guestCallsHost=function guestCallsHost(params){
	baseUrl=process.env.PHONETREETESTER_URL+'ivr/callHost';
	console.log("guestCallsHost: baseUrl "+baseUrl);
	
	//todo: find more secure source of unique conference ID (maybe hash of sid)
	params.conferenceName=params.sid;
	
	//actual value of hostPhoneNumber will be used here in production
	//but during early testing we send to process.env.CELL_PHONE_NUMBER;
	params.hostPhoneNumber=process.env.CELL_PHONE_NUMBER;
	
	url=addArrayToGetRequest(baseUrl,params,"params");
	console.log("guestCallsHost: url "+url);
	
	statusCallback=process.env.PHONETREETESTER_URL+'ivr/statusChange';
	console.log('guestCallsHost: statusCallback '+statusCallback);
	
	var call=client.calls.create({
		url:url,
		to: params.hostPhoneNumber,
		from: process.env.TWILIO_PHONE_NUMBER,
		method: 'GET',
		statusCallback:statusCallback,
		statusCallbackMethod:'GET',
		statusCallbackEvent:['initiated', 'ringing', 'answered', 'completed']
		
	}).then(x=>console.log("guestCallsHost: logging return value of client calls create "+x));
			
	const response = new VoiceResponse();
	sayAlice(response,languageConfig,"Thank you for calling Vent. Please wait while we find a host.");
	exports.addConferenceToResponse(response,params);
	responseStr=response.toString();
	console.log("guestCallsHost: "+responseStr);
	return responseStr;
};

exports.noHostAvailable=function noHostAvailable(params){
	const response=new voiceResponse();
	sayAlice(response,languageConfig,"No host is available at this time.  Please try again later.");
	addPreMainMenuGather(response,params);
	return response.toString();
};


function setHostInterval(){
	const response=new VoiceResponse();
	response.say("Setting host interval.");
	return response.toString();
}

exports.addConferenceToResponse=function addConferenceToResponse(response,params){
	//initialize response if this is its first set of verbs, e.g. when called in /ivr/handleResponseToConferenceControl
	if (response==null){
		response=new VoiceResponse();
	}
	baseUrl=process.env.PHONETREETESTER_URL+'ivr/conferenceControl';
	console.log("addConferenceToResponse: baseUrl "+baseUrl);
	url=addArrayToGetRequest(baseUrl,params,"params");

	const dial = response.dial({
		action: url,
		method: 'GET',
		hangupOnStar: true
	});
	dial.conference(params.conferenceName,{
		statusCallbackEvent:'start end join leave',
		statusCallback:process.env.PHONETREETESTER_URL+'ivr/statusChangeConference',
		statusCallbackMethod:'GET',
		waitUrl:waitUrl,
		waitMethod:'GET'
	});
	
	console.log("addConferenceToResponse: response twiml "+response.toString());
	return response.toString();
}

//todo:this function needs the userParameter array to pass to handleResponseToConferenceControl
exports.conferenceControl=function conferenceControl(params,isUserError){
	const response=new VoiceResponse();	
	if (isUserError){
		//todo: refactor the user input error into a function similar to addConferenceToResponse
		sayAlice(response,languageConfig,"Sorry, that's not a valid option.");
	}
	sayAlice(response,languageConfig,"This is conference control.  Press 1 to return to conference.  Press 2 to exit the conference and return to the main menu.");
	baseUrl='/ivr/handleResponseToConferenceControl';
	url=addArrayToGetRequest(baseUrl,params,"params");
	gather=response.gather({
		action:url,
		method:'GET'
	});
	return response.toString();
}

exports.callHost=function callHost(params){
	const response=new VoiceResponse();
	
	
	baseUrl='/ivr/handleHostResponseToOfferedGuest';
	url=addArrayToGetRequest(baseUrl,params,"params");
	
	gather=response.gather({
		action:url,
		method:'GET'
	});
	sayAlice(gather,languageConfig,"You have a call from Vent.  Press 1 to accept.  Press 2 to refuse.");
	sayAlice(response,languageConfig,"We didn't receive input.  Goodbye!");
	return response.toString();
};

exports.handleHostResponseToOfferedGuest=function handleHostResponseToOfferedGuest(digits,params){
	const response=new VoiceResponse();
	switch (digits){
		case '1':
			sayAlice(response,languageConfig,"Thank you, now connecting you to guest.");
			exports.addConferenceToResponse(response,params);
			break;
		case '2':
			sayAlice(response,languageConfig,"I'm sorry that we contacted you at an inconvenient time.  Goodbye.");
			response.hangup();
		default:
			sayAlice(response,languageConfig,"Sorry, that's not a valid option.");
			baseUrl='/ivr/callHost';
			url=addArrayToGetRequest(baseUrl,params,"params");
			response.redirect({
				method: 'GET'
			},url);
			break;
	}
	responseTwiml=response.toString()
	return responseTwiml;
}

exports.wait=function wait(){
	const response=new VoiceResponse();
	response.play({
		loop:0
	},waitSoundUrl);
	console.log("wait: response twiml "+response.toString());
	return response.toString();
}

exports.messageOtherUserAboutConferenceControl=function(params){
	
}

exports.listConferences=function listConferences(friendlyName){
	
	const opts = {status: 'in-progress',
					friendlyName:friendlyName};
	
	client.conferences.each(opts,(conference) => {
		console.log("listing conference properties: ");
		Object.entries(conference).forEach(
			([key, value]) => console.log(key, value)
		);
	});
}


exports.redirectParticipantsToMainMenu=function(params){

	//todo: specify params for each participant, as each one has a separate sid and exitStatus
	
	postConferenceUrl='/ivr/postConference';
	url=addArrayToGetRequest(postConferenceUrl,params,"params");
	console.log('redirectParticipantsToMainMenu: url '+url);
	response=new VoiceResponse();
	response.say("redirect participants to main menu");
	return response.toString();
	/*
	conf=client.conferences(params.conferenceName);
	console.log('redirectParticipantsToMainMenu: conf FriendlyName '+conf.FriendlyName);
	conf.participants.each(participant=>{
		CallSid=participant.CallSid;
		console.log('redirectParticipantsToMainMenu: participant CallSid '+CallSid);
		client.calls(CallSid).update({
			Url: url,
			Method:'GET',
		});
	  // assigning postconferenceUrl: if participant is guest (we may need a global object or database to track this) then it is defined as rateHostUrl...should host rate guest? 
	});
	*/

}

exports.postConference=function(params){
	response=new VoiceResponse();
	response.say("this is the post conference response.");
	addPreMainMenuGather(response,params);
	return response.toString();
}

//creates a url from an array of key-value pairs
//should probably move this to a separate utility class
function buildGetUrl(baseUrl,paramArray){
	url=baseUrl+"?";
	Object.keys(paramArray).forEach(function(key){
		url+=key+"="+encodeURIComponent(paramArray[key])+"&";
	});
	url=url.slice(0,-1);
	return url;
	
}

function sayAlice(voiceResponse,language,text){
	voiceResponse.say({
		voice: 'alice',
		language: language
	},text);
}
