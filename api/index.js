const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./Model/User');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const Message = require('./Model/Message')
const cookieParser = require('cookie-parser');
const ws = require('ws');


dotenv.config();
const app = express();
app.use(cookieParser())
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);
app.use(express.json());
app.use(cors({
    credentials:true,
    // origin:["http://127.0.0.1:5173", "https://mern-chat-app-pr5w.onrender.com"]
    origin:true,
}))
// app.use(cors());


mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("Connected to MONGODB")
})

app.get('/test', (req,res) => {
    res.json('test ok');
  });

  async function getUserDataFromRequest(req){
    return new Promise((resolve, reject)=>{
        const token = req.cookies?.token;
        if(token){
            console.log(token);
            jwt.verify(token, jwtSecret,{}, (err, userData)=>{
                if(err) throw err;
                resolve(userData); 
            })
        }else{
            console.log("NO token");
            reject('no token');
        }
    })
   
  }


  app.get('/messages/:userId', async (req, res)=>{
        const {userId} = req.params;
        const userData = await getUserDataFromRequest(req)
        const ourUserId = userData.userId;
        // console.log({userId, ourUserId}); 
        const messages = await Message.find({
            sender:{$in:[userId, ourUserId]},
            recepient:{$in:[userId, ourUserId]}
        }).sort({createdAt:1})
        res.json(messages)
  })

 

app.get('/profile', (req, res)=>{
    const token = req.cookies?.token;
    if(token){
        jwt.verify(token, jwtSecret,{}, (err, userData)=>{
            if(err) throw err;
            res.json(userData ); 
        })
    }else{
        res.status(401).json('no token');
    }
    
})

app.get('/people', async (req, res)=>{
    const users = await User.find({}, {'_id':1, username:1});
    res.json(users);

});


app.post('/login', async (req,res) => {
    const {username, password} = req.body;
    const foundUser = await User.findOne({username});
    if (foundUser) {
      const passOk = bcrypt.compareSync(password, foundUser.password);
      if (passOk) {
        jwt.sign({userId:foundUser._id,username}, jwtSecret, {}, (err, token) => {
          res.cookie('token', token, {sameSite:'none', secure:true}).json({
            id: foundUser._id,
          });
        });
      }
    }
  });

  app.post('/logout', (req,res)=>{
    res.cookie('token', '', {sameSite:'none', secure:true}).json('ok');
  })

app.post("/register",async(req, res)=>{
    const {username, password} = req.body;
    try{
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt)
        const createdUser = await User.create({
            username,
             password: hashedPassword
            })
    jwt.sign({userId:createdUser._id, username},jwtSecret,{},(err,token)=>{
        if(err) throw err;
        res.cookie('token', token, {sameSite:'none', secure:true}).status(201).json({
            id: createdUser._id,
        });
    } );
    }catch(err){
        if(err) throw err;
        res.status(500).json('error')
    } 

})  

const PORT = 4040 || process.env.PORT
const server = app.listen(PORT)

const wss = new ws.WebSocketServer({server});
wss.on('connection',(connection, req)=>{


    function notifyAboutOnlinePeople(){
        [...wss.clients].forEach(client=>{
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({userId:c.userId,username:c.username})),
              }));
        });
    }


    connection.isAlive = true;

  connection.timer = setInterval(() => {
    connection.ping();
    connection.deathTimer = setTimeout(() => {
      connection.isAlive = false;
      clearInterval(connection.timer);
      connection.terminate();
      notifyAboutOnlinePeople();

      console.log('dead');
    }, 1000);
  }, 5000);

  connection.on('pong', () => {
    clearTimeout(connection.deathTimer);
  });


    //read username and id
    // console.log("connected");
    const cookies = req.headers.cookie;
    if(cookies){
       tokenCookieString =  cookies.split(';').find(str=>str.startsWith('token'));
    //    console.log(tokenCookieString)
    if(tokenCookieString){
        const token = tokenCookieString.split('=')[1];
        if(token) {
            // console.log(token)
            jwt.verify(token, jwtSecret,{},(err, userData)=>{
                if(err) throw err;
                const {userId, username} = userData;
                connection.userId = userId;
                connection.username = username;
            })
        }  
    }
    }

    connection.on('message', async (message)=>{
       const  messageData =JSON.parse(message.toString())
        // console.log(messageData);
        // const {recepient, text} = messageData;
        console.log(messageData.message.text);
        const recepient = messageData.message.recepient
        const text = messageData.message.text

        if(recepient && text){
            const messageDoc = await Message.create({
            sender:connection.userId,
            recepient,
            text
            });
            [...wss.clients]
            .filter(c=> c.userId === recepient)
            .forEach(c => c.send(JSON.stringify({
                text, 
                sender:connection.userId,
                recepient,
                _id:messageDoc._id
            })))
        }
    });

    //notifying about online people
    notifyAboutOnlinePeople();
    
});

// wss.on('close', data=>{
//     console.log('disonnected', data);
// })