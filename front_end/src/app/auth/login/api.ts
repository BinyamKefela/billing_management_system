
import Cookies from "js-cookie";
import { cookies } from "next/headers";


const URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';


export function getAuthToken() {
    
    const token = Cookies.get('token');
    return token || null;
}

export async function  loginUser(email: string, password: string) {
    const result = await fetch(`${URL}/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ email:email, password:password }),
    });

    if (!result.ok) {
        throw new Error('Login failed');
    }

    const data = await result.json()
    console.log(data+"-----------");
    if (data && data.access) {
        const futureDate = new Date(9999, 0, 1); // January 1st, 9999
        Cookies.set('token', data.access, { expires: futureDate });
        Cookies.set("is_customer",data.is_customer,{expires: futureDate});
        Cookies.set("is_biller",data.is_biller,{expires: futureDate});
        Cookies.set("is_superuser",data.is_superuser,{expires: futureDate});
        Cookies.set("id",data.id,{expires: futureDate});
        Cookies.set("email",data.email,{expires: futureDate});
        Cookies.set("first_name",data.first_name,{expires: futureDate});
        Cookies.set("last_name",data.last_name,{expires: futureDate});
        Cookies.set("permissions",JSON.stringify(data.permissions),{expires: futureDate});
        console.log("cookie set");
        
    }   
    return data;
}

export function logoutUser() {
    Cookies.remove('token');
    
    
}

