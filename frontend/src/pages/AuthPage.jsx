import React,{useState} from "react";
import {Link,useNavigate,useSearchParams} from "react-router-dom";
import {authRequest} from "../authApi";
import "./AuthPage.css";
export default function AuthPage({mode="login",onAuthenticated}) {
 const register=mode==="register", [name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 const navigate=useNavigate(),[params]=useSearchParams();
 async function submit(e){e.preventDefault();setError("");setBusy(true);try{
  const r=await authRequest(`/api/auth/${register?"register":"login"}`,{method:"POST",body:JSON.stringify(register?{fullName:name,email,password}:{email,password})});
  onAuthenticated?.(r.user);navigate(params.get("next")||(r.user.Role==="admin"?"/admin":"/"));
 }catch(err){setError(err.message)}finally{setBusy(false)}}
 return <div className="auth-page"><section className="auth-card"><div className="auth-kicker">FITAI STUDIO</div><h1>{register?"Create your account":"Welcome back"}</h1><p>{register?"Save your wishlist and virtual try-ons.":"Sign in to continue your style journey."}</p><form onSubmit={submit}>
 {register&&<label>Full name<input required minLength={2} value={name} onChange={e=>setName(e.target.value)}/></label>}
 <label>Email address<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <label>Password<input required minLength={register?8:1} type="password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
 {error&&<div className="auth-error">{error}</div>}<button disabled={busy}>{busy?"Please wait…":register?"Create account":"Sign in"}</button></form>
 <div className="auth-switch">{register?"Already registered?":"New to FitAI?"} <Link to={register?"/login":"/register"}>{register?"Sign in":"Create account"}</Link></div><Link to="/">← Back to FitAI</Link></section></div>;
}
