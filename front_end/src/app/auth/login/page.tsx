'use client'
import UserForm from "@/components/forms/user-form";
import { useRouter } from "next/navigation";
export default function Login(){
    const router = useRouter();
    return(
    <div >
    <UserForm />
    </div>);
}