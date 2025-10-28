import { z } from "zod";

export const postSchema = z.object({
    id:z.number().optional(),
    title:z.string().min(1,'Title is required').max(100),
    content:z.string().min(1,'content is required').max(100)
})

export type Post = z.infer<typeof postSchema>