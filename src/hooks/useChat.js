import { useState, useEffect, useRef } from 'react';
import { generateMockResponse, seedTitles } from '../data/mockResponses';
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
export const makeChat = () => ({id:uid(), title:'New conversation', messages:[], updated:Date.now()});
function initialState() {
  try {
    const saved = JSON.parse(localStorage.getItem('nexa-chats-v1'));
    if (saved?.chats?.length && saved.chats.every(c => typeof c.id === 'string' && typeof c.title === 'string' && Array.isArray(c.messages) && c.messages.every(m=>typeof m.id==='string' && typeof m.content==='string' && ['user','assistant'].includes(m.role)))) return {...saved, active:saved.chats.some(c=>c.id===saved.active)?saved.active:saved.chats[0].id};
  } catch { /* A corrupted or unavailable cache must not stop the app. */ }
  const current = makeChat();
  return {active:current.id,chats:[current,...seedTitles.map((title,i)=>({id:uid(),title,updated:Date.now()-86400000*(i+1),messages:[{id:uid(),role:'user',content:title},{id:uid(),role:'assistant',content:generateMockResponse(title)}]}))]};
}
export function useChat() {
  const [state,setState] = useState(initialState);
  const [pending,setPending] = useState(null);
  const [regenerating,setRegenerating] = useState(null);
  const [error,setError] = useState(null);
  const [storageError,setStorageError] = useState(false);
  const timer=useRef(null), lock=useRef(false);
  useEffect(()=>{try{localStorage.setItem('nexa-chats-v1',JSON.stringify(state));setStorageError(false);}catch{setStorageError(true);}},[state]);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const update = (id,fn) => setState(s=>({...s,chats:s.chats.map(c=>c.id===id?fn(c):c)}));
  const cancel = () => {clearTimeout(timer.current);lock.current=false;setPending(null);setRegenerating(null);setError(null);};
  const generate = (chatId,userText,replaceId=null,variant=0) => {
    lock.current=true;setPending(chatId);setRegenerating(replaceId);setError(null);
    timer.current=setTimeout(()=>{
      try {
        const reply={id:uid(),role:'assistant',content:generateMockResponse(userText,variant),variant};
        update(chatId,c=>({...c,updated:Date.now(),messages:replaceId?c.messages.map(m=>m.id===replaceId?reply:m):[...c.messages,reply]}));
      } catch {setError({chatId,userText,replaceId,variant});}
      finally{lock.current=false;setPending(null);setRegenerating(null);}
    },900+Math.random()*400);
  };
  const send = (text) => {
    if (!text.trim() || lock.current) return false;
    const id=state.active;
    update(id,c=>({...c,title:c.messages.length?c.title:text.trim().replace(/\s+/g,' ').slice(0,42),updated:Date.now(),messages:[...c.messages,{id:uid(),role:'user',content:text.trim()}]}));
    generate(id,text.trim());return true;
  };
  const newChat = () => {cancel();const c=makeChat();setState(s=>({...s,active:c.id,chats:[c,...s.chats]}));};
  const remove = id => {if(pending===id)cancel();setError(null);setState(s=>{const chats=s.chats.filter(c=>c.id!==id);if(s.active===id){const c=makeChat();return {active:c.id,chats:[c,...chats]};}return {...s,chats};});};
  const regenerate = messageId => {
    if(lock.current)return;
    const c=state.chats.find(c=>c.id===state.active),index=c.messages.findIndex(m=>m.id===messageId);
    const question=c.messages.slice(0,index).reverse().find(m=>m.role==='user');
    if(question)generate(c.id,question.content,messageId,(c.messages[index].variant??0)+1);
  };
  return {chats:state.chats,active:state.active,current:state.chats.find(c=>c.id===state.active),pending,regenerating,error,storageError,send,newChat,remove,regenerate,
    select:id=>{setState(s=>({...s,active:id}));setError(null);},rename:(id,title)=>update(id,c=>({...c,title})),feedback:(id,value)=>update(state.active,c=>({...c,messages:c.messages.map(m=>m.id===id?{...m,feedback:m.feedback===value?null:value}:m)})),retry:()=>{if(error&&!lock.current)generate(error.chatId,error.userText,error.replaceId,error.variant);}};
}
