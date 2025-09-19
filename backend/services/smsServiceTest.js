// Your AccountSID and Auth Token from console.twilio.com
import twilio from 'twilio';

const accountSid = 'aaaaaaaaaaaaaaaaaa';
const authToken = 'AAAAAAAAAAAAAA';

const client = twilio(accountSid, authToken);

client.messages
  .create({
    body: 'Tu DNI está listo',
    to: '+5197868601', // Text your number
    from: '+188888888946', // From a valid Twilio number
  })
  .then((message) => console.log(message.sid));