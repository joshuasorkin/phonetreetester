//so if i understand the handler structure,
//what we are doing is: export functions that are decision points
//so that we can redirect to them
//or maybe it's that we export functions that end with the need to send POST request
//back to the router
//so how should we handle the client.calls.create() request?  seems like this breaks the
//router/handler abstraction

//todo: refactor methods like buildGetUrl() and sayAlice() into SRO-observant files/classes
//todo: remove versions from source control containing hyperspacecraft.net references and phone numbers (use '[+]\d{10}' regex)

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
//const waitSoundUrl='http://hyperspacecraft.net/twilioTest/Sheena%20Easton%20-%20Telephone%20HQHD.mp3';
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

exports.buildPreMainMenuGather=function buildPreMainMenuGather(sid,exitStatus,userId){
	var voiceResponse = new VoiceResponse();
	

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
	
	addPreMainMenuGather(voiceResponse,sid,exitStatus,userId);

	responseStr=voiceResponse.toString();
	return responseStr;
	
}

exports.preMainMenuGatherWithError=function preMainMenuGatherWithError(params){
	var response=new VoiceResponse();
	sayAlice(response,languageConfig,"Sorry, that's not a valid option.");
	addPreMainMenuGather(response,params.sid,params.exitStatus,params.userId);
	return response.toString();
}

//should change this so that we're passing in a 'user' parameter that is the array of parameters.
//maybe this indicates that a standardized user params data structure would be helpful.
//need to decide on schema: what are all the properties that would be useful for a 'user' array?
function addPreMainMenuGather(voiceResponse,sid,exitStatus,userId){
	params={'sid':sid,
			'exitStatus':exitStatus,
			'userId':userId};
	//url=buildGetUrl('/ivr/menu',params);
	url="/ivr/menu?"+querystring.stringify({'params':JSON.stringify(params)});
	
	console.log("addPreMainMenuGather: url "+url);

	const gather = voiceResponse.gather({
		action: url,
		numDigits: '1',
		method: 'GET',
		timeout: 10
	});
	sayAlice(gather,languageConfig,"Welcome to Vent.  Your current host status is.  \""+exitStatus+"\".  Press 1 to call a host.  Press 2 to change host status.  Press 3. Or hang up. To exit.");
	//gather.play({loop: 3}, bodyUrl);
	
}

exports.switchHostStatus=function switchHostStatus(exitStatus,sid,userId){
	return new Promise(function(resolve,reject){
		var exitStatusToSet;
		switch(exitStatus){
			case 'available':
				exitStatusToSet="in use";
				break;
			case 'in use':
				exitStatusToSet="available";
				break;
		}
		console.log("switchHostStatus: before calling updateUserExitStatus");
		db.updateUserExitStatus(exitStatusToSet,userId).then(value=>{
			console.log("switchHostStatus: .then after calling updateUserExitStatus");
			preMainMenuGather=exports.buildPreMainMenuGather(sid,exitStatusToSet,userId);
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



exports.guestCallsHost=function guestCallsHost(sid,hostPhoneNumber,hostId){
	baseUrl=process.env.PHONETREETESTER_URL+'ivr/callHost';
	console.log("guestCallsHost: baseUrl "+baseUrl);
	//todo: find more secure source of unique conference ID (maybe hash of sid)
	conferenceName=sid;
	params={'conferenceName':conferenceName,
			'hostId':hostId};
	url=buildGetUrl(baseUrl,params);
	console.log("guestCallsHost: url "+url);
	
	if (hostPhoneNumber==null){
		hostPhoneNumber=process.env.CELL_PHONE_NUMBER;
	}
	
	statusCallback=process.env.PHONETREETESTER_URL+'ivr/statusChange';
	console.log('guestCallsHost: statusCallback '+statusCallback);
	
	var call=client.calls.create({
		url:url,
		to: hostPhoneNumber,
		from: process.env.TWILIO_PHONE_NUMBER,
		method: 'GET',
		statusCallback:statusCallback,
		statusCallbackMethod:'GET',
		statusCallbackEvent:['initiated', 'ringing', 'answered', 'completed']
		
	}).then(x=>console.log("guestCallsHost: logging return value of client calls create "+x));
			
	const response = new VoiceResponse();
	sayAlice(response,languageConfig,"Thank you for calling Vent. Please wait while we find a host.");
	exports.addConferenceToResponse(response,conferenceName);
	responseStr=response.toString();
	console.log("guestCallsHost: "+responseStr);
	return responseStr;
};

exports.noHostAvailable=function noHostAvailable(sid){
	const response=new voiceResponse();
	sayAlice(response,languageConfig,"No host is available at this time.  Please try again later.");
	addPreMainMenuGather(response,sid);
	return response.toString();
};


function setHostInterval(){
	const response=new VoiceResponse();
	response.say("Setting host interval.");
	return response.toString();
}

exports.addConferenceToResponse=function addConferenceToResponse(response,conferenceName){
	//initialize response if this is its first set of verbs, e.g. when called in /ivr/handleResponseToConferenceControl
	if (response==null){
		response=new VoiceResponse();
	}
	baseUrl=process.env.PHONETREETESTER_URL+'ivr/conferenceControl';
	console.log("addConferenceToResponse: baseUrl "+baseUrl);
	//todo: find more secure source of unique conference ID (maybe hash of sid)
	params={'conferenceName':conferenceName};
	url=buildGetUrl(baseUrl,params);

	const dial = response.dial({
		action: url,
		method: 'GET',
		hangupOnStar: true
	});
	dial.conference(conferenceName,{
		statusCallbackEvent:'start end join leave',
		statusCallback:process.env.PHONETREETESTER_URL+'ivr/statusChangeConference',
		statusCallbackMethod:'GET',
		waitUrl:waitUrl,
		waitMethod:'GET'
	});
	
	console.log("addConferenceToResponse: response twiml "+response.toString());
	return response.toString();
}


exports.conferenceControl=function conferenceControl(conferenceName,isUserError){
	const response=new VoiceResponse();
	if (isUserError){
		//todo: refactor the user input error into a function similar to addConferenceToResponse
		sayAlice(response,languageConfig,"Sorry, that's not a valid option.");
	}
	sayAlice(response,languageConfig,"This is conference control.  Press 1 to return to conference.  Press 2 to exit the conference and return to the main menu.");
	baseUrl='/ivr/handleResponseToConferenceControl';
	params={'conferenceName':conferenceName};
	url=buildGetUrl(baseUrl,params);
	gather=response.gather({
		action:url,
		method:'GET'
	});
	return response.toString();
}

exports.callHost=function callHost(conferenceName){
	const response=new VoiceResponse();
	
	params={'conferenceName':conferenceName};
	
	baseUrl='/ivr/handleHostResponseToOfferedGuest';
	url=buildGetUrl(baseUrl,params);
	
	gather=response.gather({
		action:url,
		method:'GET'
	});
	sayAlice(gather,languageConfig,"You have a call from Vent.  Press 1 to accept.  Press 2 to refuse.");
	sayAlice(response,languageConfig,"We didn't receive input.  Goodbye!");
	return response.toString();
};

exports.handleHostResponseToOfferedGuest=function handleHostResponseToOfferedGuest(digits,conferenceName){
	const response=new VoiceResponse();
	switch (digits){
		case '1':
			sayAlice(response,languageConfig,"Thank you, now connecting you to guest.");
			exports.addConferenceToResponse(response,conferenceName);
			break;
		case '2':
			sayAlice(response,languageConfig,"I'm sorry that we contacted you at an inconvenient time.  Goodbye.");
			response.hangup();
		default:
			sayAlice(response,languageConfig,"Sorry, that's not a valid option.");
			params={'conferenceName':conferenceName};
			baseUrl='/ivr/callHost';
			url=buildGetUrl(baseUrl,params);
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
	url=process.env.PHONETREETESTER_URL+'ivr/wait';
	response.play({
		loop:0
	},url);
	return response.toString();
}

exports.planets = function planets(digit) {
  const optionActions = {
    '2': '+12024173378',
    '3': '+12027336386',
    '4': '+12027336637',
  };

  if (optionActions[digit]) {
    const twiml = new VoiceResponse();
    twiml.dial(optionActions[digit]);
    return twiml.toString();
  }

  return redirectWelcome();
};

/**
 * Returns Twiml
 * @return {String}
 */
function giveExtractionPointInstructions() {
  const twiml = new VoiceResponse();

  twiml.say(
    'To get to your extraction point, get on your bike and go down ' +
    'the street. Then Left down an alley. Avoid the police cars. Turn left ' +
    'into an unfinished housing development. Fly over the roadblock. Go ' +
    'passed the moon. Soon after you will see your mother ship.',
    {voice: 'alice', language: 'en-GB'}
  );

  twiml.say(
    'Thank you for calling the ET Phone Home Service - the ' +
    'adventurous alien\'s first choice in intergalactic travel'
  );

  twiml.hangup();

  return twiml.toString();
}

/**
 * Returns a TwiML to interact with the client
 * @return {String}
 */
function listPlanets() {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    action: '/ivr/planets',
    numDigits: '1',
    method: 'POST',
  });

  gather.say(
    'To call the planet Broh doe As O G, press 2. To call the planet DuhGo ' +
    'bah, press 3. To call an oober asteroid to your location, press 4. To ' +
    'go back to the main menu, press the star key ',
    {voice: 'alice', language: 'en-GB', loop: 3}
  );

  return twiml.toString();
}

/**
 * Returns an xml with the redirect
 * @return {String}
 */
function redirectWelcome() {
  const twiml = new VoiceResponse();

  twiml.say('Returning to the main menu', {
    voice: 'alice',
    language: 'en-GB',
  });

  twiml.redirect('/ivr/welcome');

  return twiml.toString();
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
