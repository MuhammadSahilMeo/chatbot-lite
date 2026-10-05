import {useEffect,useRef,useState} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {Copy,Check,RefreshCw,ThumbsUp,ThumbsDown,AlertCircle} from 'lucide-react';
import {Logo,IconButton} from './UI';
export async function copyText(text) {
 if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}
 const el=document.createElement('textarea');el.value=text;el.style.position='fixed';el.style.opacity='0';document.body.appendChild(el);el.select();const ok=document.execCommand('copy');el.remove();if(!ok)throw new Error('Clipboard unavailable');
}
function CopyButton({text,code=false}){
 const [state,setState]=useState(''),timer=useRef(null);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 async function copy(){try{await copyText(text);setState('Copied');}catch{setState('Copy failed');}clearTimeout(timer.current);timer.current=setTimeout(()=>setState(''),2000);}
 return <button className={code?'code-copy':'icon-button copy-action'} onClick={copy} aria-label={state||(code?'Copy code':'Copy response')} title={state||(code?'Copy code':'Copy response')}>{state==='Copied'?<Check size={14}/>:<Copy size={14}/>}<span>{state||(code?'Copy':'')}</span></button>;
}
function CodeBlock({children}){
 const node=children?.props, language=/language-(\w+)/.exec(node?.className||'')?.[1]||'code',content=String(node?.children??'').replace(/\n$/,'');
 return <div className="code-block"><div className="code-header"><span>{language}</span><CopyButton text={content} code/></div><pre>{children}</pre></div>;
}
export function MessageBubble({message,chat}){
 const assistant=message.role==='assistant';
 return <article className={`message-row ${assistant?'assistant':'user'}`} aria-label={assistant?'Nexa AI response':'Your message'}>{assistant&&<Logo small/>}<div className="message-body"><div className="message-name">{assistant?'Nexa AI':'You'}{assistant&&<span>ASSISTANT</span>}</div><div className="message-content">{assistant?<ReactMarkdown remarkPlugins={[remarkGfm]} components={{pre:CodeBlock,a:({children,href})=><a href={href} target="_blank" rel="noopener noreferrer">{children}</a>}}>{message.content}</ReactMarkdown>:<p>{message.content}</p>}</div>{assistant&&<div className="message-actions"><CopyButton text={message.content}/><IconButton label="Regenerate response" disabled={!!chat.pending} onClick={()=>chat.regenerate(message.id)}><RefreshCw size={14}/></IconButton><span className="action-divider"/><IconButton label="Like response" aria-pressed={message.feedback==='like'} onClick={()=>chat.feedback(message.id,'like')}><ThumbsUp size={14}/></IconButton><IconButton label="Dislike response" aria-pressed={message.feedback==='dislike'} onClick={()=>chat.feedback(message.id,'dislike')}><ThumbsDown size={14}/></IconButton></div>}</div>{!assistant&&<span className="message-avatar">SM</span>}</article>;
}
export default function ChatMessages({chat}){
 const end=useRef(null);
 useEffect(()=>{end.current?.scrollIntoView?.({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'end'});},[chat.current.messages,chat.active,chat.pending,chat.error]);
 return <div className="messages" role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions text">{chat.current.messages.filter(m=>m.id!==chat.regenerating).map(m=><MessageBubble key={m.id} message={m} chat={chat}/>)}{chat.pending===chat.active&&<div className="message-row assistant typing-row"><Logo small/><div><div className="message-name">Nexa AI is typing...</div><div className="typing-dots"><i/><i/><i/></div></div></div>}{chat.error?.chatId===chat.active&&<div className="error-box" role="alert"><AlertCircle size={18}/><span>Something went wrong. Please try again.</span><button onClick={chat.retry}>Retry</button></div>}<div ref={end}/></div>;
}
