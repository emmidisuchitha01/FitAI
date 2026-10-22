const API = "http://localhost:5000";
export async function authRequest(path, options={}) {
  const response = await fetch(`${API}${path}`, {
    ...options, credentials:"include",
    headers:{"Content-Type":"application/json",...(options.headers||{})}
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error||"Request failed.");
  return data;
}
