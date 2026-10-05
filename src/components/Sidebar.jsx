import { useState,useEffect,useRef } from 'react';
import { Plus,Search,MessageSquare,MoreHorizontal,Pencil,Trash2,Settings, CircleHelp,ChevronsUpDown,PanelLeftClose,X,ArrowUpRight } from 'lucide-react';
import { Logo, IconButton, Dropdown } from './UI';
export default function Sidebar({chat,open,onClose,onModal}) {
 const [query,setQuery]=useState(''),[menu,setMenu]=useState(null),ref=useRef(null);
 useEffect(()=>{if(!open)return;const previous=document.activeElement;ref.current?.querySelector('button')?.focus();const key=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const buttons=[...ref.current.querySelectorAll('button,input')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus();};},[open,onClose]);
 const [mobile,setMobile]=useState(()=>window.innerWidth<=800);
 useEffect(()=>{const resize=()=>setMobile(window.innerWidth<=800);window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 const filtered=chat.chats.filter(c=>c.title.toLowerCase().includes(query.toLowerCase()));
 return <>{open&&<button className="drawer-backdrop" aria-label="Close sidebar" onClick={onClose}/>}
 <aside ref={ref} inert={mobile&&!open?true:undefined} className={`sidebar ${open?'is-open':''}`} aria-label="Conversation sidebar">
  <div className="brand"><Logo/><div><strong>Nexa<span> AI</span></strong><small>Your intelligent assistant</small></div><IconButton label="Close sidebar" onClick={onClose}><PanelLeftClose size={19}/></IconButton></div>
  <button className="new-chat" onClick={()=>{chat.newChat();setQuery('');onClose();}}><Plus size={19}/><span>New chat</span><span className="shortcut">↗</span></button>
  <label className="search"><Search size={16}/><input aria-label="Search conversations" placeholder="Search conversations..." value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<IconButton label="Clear search" onClick={()=>setQuery('')}><X size={13}/></IconButton>}</label>
  <div className="history-label">YOUR CONVERSATIONS <span>{chat.chats.length}</span></div>
  <nav className="history" aria-label="Chat history">{!filtered.length?<div className="no-results"><Search size={24}/><p>No conversations found</p><small>Try a different search.</small></div>:filtered.map(c=><div className={`history-row ${c.id===chat.active?'active':''}`} key={c.id}>
    <button className="conversation-select" onClick={()=>{chat.select(c.id);onClose();}} aria-current={c.id===chat.active?'page':undefined}><MessageSquare size={16}/><span>{c.title}</span>{chat.pending===c.id&&<span className="working-dot"/>}</button>
    <IconButton label={`Options for ${c.title}`} aria-expanded={menu===c.id} onClick={()=>setMenu(menu===c.id?null:c.id)}><MoreHorizontal size={17}/></IconButton>
    {menu===c.id&&<Dropdown onClose={()=>setMenu(null)}><button onClick={()=>{onModal({type:'rename',id:c.id,title:c.title});setMenu(null);}}><Pencil size={15}/>Rename</button><button className="danger" onClick={()=>{onModal({type:'delete',id:c.id,title:c.title});setMenu(null);}}><Trash2 size={15}/>Delete</button></Dropdown>}
   </div>)}</nav>
  <div className="sidebar-bottom"><div className="local-note"><span className="status-dot"/><span>Local workspace</span><span className="demo-tag">DEMO</span></div><button className="sidebar-link" onClick={()=>onModal({type:'settings'})}><Settings size={18}/>Settings</button><button className="sidebar-link" onClick={()=>onModal({type:'help'})}><CircleHelp size={18}/>Help & getting started<ArrowUpRight size={14}/></button><button className="user-profile" onClick={()=>onModal({type:'profile'})}><span className="avatar">US</span><span><strong>Usman Shah</strong><small>Full Stack Developer</small></span><ChevronsUpDown size={16}/></button></div>
 </aside></>;
}
