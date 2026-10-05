import { useEffect, useRef } from 'react';
import { Sparkles, X } from 'lucide-react';
export function Logo({small=false}) {return <span className={`logo-mark ${small?'small':''}`}><Sparkles size={small?19:25} strokeWidth={1.7}/></span>;}
export function IconButton({label,children,...props}){return <button className="icon-button" type="button" aria-label={label} title={label} {...props}>{children}</button>;}
export function Modal({title,children,onClose}) {
  const ref=useRef(null);
  useEffect(()=>{
    const before=document.activeElement;
    const el=ref.current;el.querySelector('input,button')?.focus();
    const key=e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const items=[...el.querySelectorAll('button,input,textarea,a[href]')].filter(x=>!x.disabled);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
    document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);before?.focus();};
  },[onClose]);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="modal" ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><IconButton label="Close dialog" onClick={onClose}><X size={18}/></IconButton></header>{children}</section></div>;
}
export function Dropdown({children,onClose,className=''}){
 const ref=useRef(null);
 useEffect(()=>{const close=e=>{if(!ref.current?.contains(e.target))onClose();};const key=e=>{if(e.key==='Escape')onClose();};document.addEventListener('pointerdown',close);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',key);};},[onClose]);
 return <div ref={ref} className={`dropdown ${className}`}>{children}</div>;
}
