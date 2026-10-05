import {useState,useEffect,useCallback,useRef} from 'react';
import {Sun,Moon,ShieldCheck,Keyboard,MessageSquare,Check,X} from 'lucide-react';
import {useChat} from './hooks/useChat';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import WelcomeScreen from './components/WelcomeScreen';
import ChatMessages from './components/ChatMessages';
import MessageInput from './components/MessageInput';
import {Modal,IconButton} from './components/UI';
export default function App(){
 const chat=useChat(),[drawer,setDrawer]=useState(false),[modal,setModal]=useState(null),[rename,setRename]=useState(''),[notice,setNotice]=useState('');
 const [theme,setTheme]=useState(()=>{try{return localStorage.getItem('nexa-theme')==='dark'?'dark':'light';}catch{return 'light';}});
 const noticeTimer=useRef(null);
 useEffect(()=>{document.documentElement.dataset.theme=theme;try{localStorage.setItem('nexa-theme',theme);}catch{}},[theme]);
 useEffect(()=>()=>clearTimeout(noticeTimer.current),[]);
 useEffect(()=>{const resize=()=>{if(window.innerWidth>800)setDrawer(false);};window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
 const closeDrawer=useCallback(()=>setDrawer(false),[]),closeModal=useCallback(()=>setModal(null),[]);
 const showModal=m=>{setDrawer(false);setRename(m.title||'');setModal(m);};
 const notify=message=>{setNotice(message);clearTimeout(noticeTimer.current);noticeTimer.current=setTimeout(()=>setNotice(''),6000);};
 const exportChat=()=>{const text=chat.current.messages.map(m=>`${m.role==='user'?'You':'Nexa AI'}\n${m.content}`).join('\n\n---\n\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download=`nexa-${chat.current.title.replace(/[^a-z0-9]/gi,'-').slice(0,40)}.txt`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Conversation exported.');};
 const toggleTheme=()=>setTheme(t=>t==='light'?'dark':'light');
 return <div className="app-shell"><a className="skip-link" href="#chat-input">Skip to message input</a><Sidebar chat={chat} open={drawer} onClose={closeDrawer} onModal={showModal}/><main className="main-panel" inert={drawer?true:undefined}><ChatHeader theme={theme} toggleTheme={toggleTheme} openSidebar={()=>setDrawer(true)} onModal={showModal} chat={chat} onExport={exportChat}/><div className={`chat-scroll ${!chat.current.messages.length?'empty-chat':''}`}>{chat.current.messages.length?<><div className="conversation-date"><span/>YOUR CONVERSATION<span/></div><ChatMessages chat={chat}/></>:<WelcomeScreen onSend={chat.send} disabled={!!chat.pending}/>}</div><div id="chat-input"><MessageInput onSend={chat.send} busy={!!chat.pending} onNotice={notify} focusKey={chat.active}/></div>{chat.storageError&&<div className="storage-warning" role="status">Browser storage is full or unavailable. New changes will last for this visit only.</div>}</main>
 {notice&&<div className="toast" role="status"><Check size={17}/><span>{notice}</span><IconButton label="Dismiss notification" onClick={()=>setNotice('')}><X size={16}/></IconButton></div>}
 {modal&&<Modal onClose={closeModal} title={modal.type==='rename'?'Rename conversation':modal.type==='delete'?'Delete conversation?':modal.type==='settings'?'Make yourself at home':modal.type==='profile'?'Your workspace profile':'A little help to get started'}>
 {modal.type==='rename'&&<form onSubmit={e=>{e.preventDefault();if(rename.trim()){chat.rename(modal.id,rename.trim());closeModal();}}}><label className="field-label" htmlFor="conversation-name">Conversation name</label><input id="conversation-name" className="modal-input" maxLength={100} value={rename} onChange={e=>setRename(e.target.value)}/><div className="modal-actions"><button type="button" className="secondary-button" onClick={closeModal}>Cancel</button><button className="primary-button" disabled={!rename.trim()}>Save name</button></div></form>}
 {modal.type==='delete'&&<><p>“{modal.title}” and its messages will be removed from this browser. This cannot be undone.</p><div className="modal-actions"><button className="secondary-button" onClick={closeModal}>Keep conversation</button><button className="danger-button" onClick={()=>{chat.remove(modal.id);closeModal();notify('Conversation deleted.');}}>Delete conversation</button></div></>}
 {modal.type==='settings'&&<><p>Choose the appearance that feels right for you.</p><div className="theme-options">{['light','dark'].map(t=><button key={t} aria-pressed={theme===t} onClick={()=>setTheme(t)}>{t==='light'?<Sun size={21}/>:<Moon size={21}/>}<span>{t==='light'?'Light mode':'Dark mode'}</span>{theme===t&&<Check size={16}/>}</button>)}</div><div className="info-card"><ShieldCheck size={22}/><div><strong>A browser-local workspace</strong><p>Conversations and your theme are saved on this device. No AI API, backend, or database is connected. Clearing browser data removes saved chats.</p></div></div></>}
 {modal.type==='help'&&<><div className="help-row"><Keyboard size={22}/><div><strong>Keep the conversation flowing</strong><p>Enter sends your message. Shift + Enter adds a new line. Use the moon or sun in the header to change theme.</p></div></div><div className="help-row"><MessageSquare size={22}/><div><strong>Your ideas, organized</strong><p>Start a new chat, search your history, or use a conversation’s menu to rename or delete it. Copy, regenerate, and rate replies under each response.</p></div></div><div className="info-card"><ShieldCheck size={22}/><div><strong>About this demo</strong><p>All replies use local rules and templates. Attachments record file names only. The app does not analyze files or retrieve live information.</p></div></div></>}
 {modal.type==='profile'&&<div className="profile-detail"><span className="avatar large">US</span><h3>Usman Shah</h3><p>Full Stack Developer</p><span className="profile-badge">Personal workspace</span><div className="info-card"><p>This is the local demo profile. Account sign-in can be integrated later.</p></div></div>}
 </Modal>}</div>;
}
