import { z } from "zod";

export const userSchema = z.object({
    //id:z.number().optional(),
    //name:z.string().min(1,'Name is required').max(100),
    email:z.string().min(1,'Email is required').email('Invalid email format').max(100),
    password:z.string().min(6,'Password must be at least 6 characters').max(100),
    //role:z.enum(['admin','user'],{required_error:'Role is required'}),
})

export type UserInput = z.infer<typeof userSchema>


export type User = {
  name: string;
  email: string;
};