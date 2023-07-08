import { useContext, useEffect, useState, useRef } from "react"
import Avatar from "./Avatar";
import axios from "axios"
import { UserContext } from "./UserContext";
import { AxiosInstance } from "axios";
import {uniqBy} from "lodash"
import Contact from "./Contact";
import { axiosInstance } from "./config";

function Chat() {

    const [ws, setWs] = useState(null);
    const [onlinePeople, setOnlinePeople] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null)
    const [newMessage, setNewMessage] = useState('')
    const [messages, setMessages] = useState([])
    const divUnderMessages = useRef();
    const [offlinePeople, setOfflinePeoole] = useState({})

    const {username, id, setId, setUsername}  = useContext(UserContext)

    useEffect(()=>{
        connectToWs();
    }, []);

    function connectToWs(){
        const ws = new WebSocket('ws://localhost:4040');
        // const ws = new WebSocket('wss://mern-chat-app-pr5w.onrender.com');
        setWs(ws);
        ws.addEventListener('message', handleMessage);
        ws.addEventListener('close', ()=>{
            setTimeout(()=>{
                console.log("disconnected");
                connectToWs();
            }, 1000)
        });
    }
    

    function showOnlinePeople(peopleArray){
       const people = {};
       peopleArray.forEach(({userId, username})=>{
            people[userId] = username;
       })
    //    console.log(people)
        setOnlinePeople(people);
    }

    function sendMessage(ev){
        ev.preventDefault();
        ws.send(JSON.stringify({
            message:{
                recepient:selectedUserId,
                text: newMessage
            }
        }));
        setNewMessage('');
        setMessages(prev => ([...prev,{
            text: newMessage,
            sender: id,
            recipient: selectedUserId,
            _id: Date.now(),
            }]))
            
    }

    useEffect(()=>{
        axiosInstance.get('/people').then(res=>{
            const offlinePeopleArr = res.data
            .filter(p=>p._id!==id)
            .filter(p=> !Object.keys(onlinePeople).includes(p._id))
            // console.log(offlinePeople);
            const offlinePeople = {};
            offlinePeopleArr.forEach(p=>{
                offlinePeople[p._id] = p
            });
            setOfflinePeoole(offlinePeople);
        })
    }, [onlinePeople])

    useEffect(()=>{
        const div = divUnderMessages.current;
        console.log(div);
        if(div){
        div.scrollIntoView({behavior:'smooth', block:'end'});
        }
    },[messages])

    useEffect(()=>{
        if(selectedUserId)
        axiosInstance.get('/messages/'+selectedUserId).then(res =>{
            // const {data} = res;
            setMessages(res.data)
        });
    }, [selectedUserId])

    function handleMessage(e){
        const messageData = JSON.parse(e.data)
    //    console.log(messageData)
        // console.log({e, messageData})
       if('online' in messageData){
        // console.log({messageData});
        showOnlinePeople(messageData.online)
       }else if('text' in messageData){
        // console.log({messageData})
        setMessages(prev => ([...prev,{...messageData}]))
       }
    }

    function logout() {
        axiosInstance.post('/logout').then(() => {
          setWs(null);
          setId(null);
          setUsername(null);
        });
      }

    const onlinePeopleExclOurUser = {...onlinePeople}
    delete onlinePeopleExclOurUser[id]

    const messagesWithoutDupes = uniqBy(messages, '_id');
    // console.log(messagesWithoutDupes);
    // console.log("hi");
    // console.log(messages);

  return (
    <div className="flex h-screen"> 
        <div className="bg-white w-1/3 pl-1 pt-4 flex flex-col">
            <div className="flex-frow">
            <div className="text-blue-600 font-bold flex gap-2 mb-4 p-4"> 
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            MERN CHAT</div>
            {Object.keys(onlinePeopleExclOurUser).map(userId =>(
            <Contact key={userId} id={userId} 
            username={onlinePeopleExclOurUser[userId]}
            onClick={()=>setSelectedUserId(userId)}
            selected = {userId === selectedUserId ? userId:selectedUserId}
            // selected = {userId}
            online={true}
            />
        ))}   
            {Object.keys(offlinePeople).map(userId =>(
            <Contact key={userId} id={userId} 
            username={offlinePeople[userId].username}
            onClick={()=>setSelectedUserId(userId)}
            selected = {userId === selectedUserId ? userId:selectedUserId}
            // selected={userId}
            online={false}
            />
        ))}  
        </div>
        <div className="p-2 text-center mt-4 flex flex-col">
        <div className="flex flex-col text-center items-center mb-2">
        <span className="flex gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div className="text-blue-600 font-bold">
            {username}
            </div></span>
        </div>
            <button onClick={logout}
            className="text-sm text-red-400 bg-red-100 px-5 py-2 rounded-sm">Logout</button>
         </div> 
        </div> 
        <div className="flex flex-col bg-blue-50 w-2/3 p-2">
            <div className="flex-grow">
                {! selectedUserId && (
                    <div className="flex flex-grow h-full items-center justify-center">
                        <div className="text-grey-300">&larr; selected a person</div>
                    </div>
                )}
                {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messagesWithoutDupes.map(message => (
                  <div key={message._id} className={(message.sender === id ? 'text-right': 'text-left')}>
                    <div className={"text-left inline-block p-2 my-2 rounded-md text-sm " +(message.sender === id ? 'bg-blue-500 text-white':'bg-white text-gray-500')}>
                      {message.text}
                     
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
                </div>
                {selectedUserId && (
                <form className="flex gap-2" onSubmit={sendMessage}>
                <input type="text" value={newMessage} onChange={e=>setNewMessage(e.target.value)} 
                className="bg-white border p-2 flex-grow rounded-sm" 
                placeholder="Type here" border />
                <button type="submit" className="bg-blue-200 p-2  rounded-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" 
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 
                    59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
                </button>
            </form>)}
            
        </div>
    </div>
  )
}

export default Chat

// < key={message.text} className={(message.sender === id? 'text-right':'text-left')}>