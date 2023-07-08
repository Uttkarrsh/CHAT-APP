import { useContext, useState } from "react"
import axios from "axios"
import { axiosInstance } from "./config";
import { UserContext } from "./UserContext";

function Register() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginOrRegiter, setIsLoginOrRegister] = useState('register')
    const {setUsername:setLoggedInUsername, setId} = useContext(UserContext)

    async function handleSubmit(ev){
        ev.preventDefault();
        const url = isLoginOrRegiter === 'register'?'register':'login';
        const {data} = await axios.post(url, {username, password});
        setLoggedInUsername(username);
        setId(data.id);
    }

  return (
    <div className="bg-blue-50 h-screen flex items-center mb-12">
        <form className="w-64 mx-auto" onSubmit={handleSubmit}>
      <h1 className="mb-5 text-center text-3xl">{isLoginOrRegiter==='register' ? 'REGISTER':'LOGIN'}</h1>

            <input type="text" value={username} onChange={ev=>setUsername(ev.target.value)} 
            placeholder="username" className="block w-full rounded-sm p-2 mb-2 border"/>
            <input type="password" value={password} onChange={ev=>setPassword(ev.target.value)}
             placeholder="password" className="block w-full rounded-sm p-2 mb-2 border"></input>
            <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
              {isLoginOrRegiter === 'register' ? 'Register' : 'Login'}
              </button>
            <div className="text-center mt-2">
              {
                isLoginOrRegiter == 'register' && (
                  <div>
                    Already registered?
                    <button onClick={()=> setIsLoginOrRegister('login')}>
                Login Here</button>
                    </div>
                )
              }
            {isLoginOrRegiter === 'login' &&(
              <div>
              Dont have account?
              <button onClick={()=> setIsLoginOrRegister('register')}>
          Register Here</button>
              </div>
            )}
              </div>
        </form>
    </div>
  )
}

export default Register
