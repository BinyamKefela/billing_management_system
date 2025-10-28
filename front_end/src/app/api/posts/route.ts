import { NextResponse } from "next/server";
import { title } from "process";

let posts = [{id:1,title:'First Post',content:"this is my first post"},
    {id:2,title:"Second post",content:"this is my second post"}
]


const generated = () => Math.max(...posts.map(post=>post.id),0)+1;


export async function POST(request:Request){
    const body = await request.json();
    const newPost = {
        id:generated,
        title:body.title,
        content:body.content
    }
}


export async function PUT(request:Request){
    const body = await request.json();
    const postIndex = posts.findIndex(post=>post.id===body.id);

    if(postIndex===-1){
        return NextResponse.json({error:'Post not found'},{status:404});
    }

    posts[postIndex] = {...posts[postIndex],...body};
    return NextResponse.json(posts[postIndex]);
}



export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get('id'));
  
  const postIndex = posts.findIndex(post => post.id === id);
  
  if (postIndex === -1) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  
  posts = posts.filter(post => post.id !== id);
  return NextResponse.json({ success: true });
}