import {describe,it,expect,beforeEach,afterEach,vi} from 'vitest';
import {render,screen,fireEvent,act,cleanup,within} from '@testing-library/react';
import App from './App';
import {generateMockResponse} from './data/mockResponses';
import * as engine from './data/mockResponses';
function send(text){fireEvent.change(screen.getByRole('textbox',{name:'Message Nexa AI'}),{target:{value:text}});fireEvent.click(screen.getByRole('button',{name:'Send message'}));}
async function finish(){await act(async()=>{vi.advanceTimersByTime(1500);});}
beforeEach(()=>{localStorage.clear();vi.useFakeTimers();Object.defineProperty(navigator,'clipboard',{value:{writeText:vi.fn().mockResolvedValue()},configurable:true});});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers();});
describe('Nexa workspace',()=>{
 it('sends arbitrary messages, prevents duplicates, saves and restores history',async()=>{
  const view=render(<App/>);send('A surprising question about oceans');
  expect(screen.getByText('Nexa AI is typing...')).toBeTruthy();
  expect(screen.getByRole('button',{name:'Generating response'}).disabled).toBe(true);
  await finish();expect(screen.getByText(/You’re asking about/)).toBeTruthy();
  expect(JSON.parse(localStorage.getItem('nexa-chats-v1')).chats[0].messages).toHaveLength(2);
  view.unmount();render(<App/>);expect(screen.getByRole('log').textContent).toContain('oceans');
 });
 it('handles prompt cards, code blocks, clipboard, ratings, and regeneration',async()=>{
  render(<App/>);fireEvent.click(screen.getByRole('button',{name:/Explain JavaScript/}));await finish();
  expect(screen.getByRole('log').textContent).toContain('getGreeting');
  fireEvent.click(screen.getByRole('button',{name:'Copy response'}));
  await act(async()=>{await Promise.resolve();});expect(navigator.clipboard.writeText).toHaveBeenCalled();expect(screen.getByRole('button',{name:'Copied'})).toBeTruthy();
  const like=screen.getByRole('button',{name:'Like response'});fireEvent.click(like);expect(like.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button',{name:'Dislike response'}));expect(like.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(screen.getByRole('button',{name:'Regenerate response'}));await finish();expect(screen.getByRole('log').textContent).toContain('Try this next');
 });
 it('searches, renames, deletes with confirmation, and starts a new chat',async()=>{
  render(<App/>);send('My unique chat');await finish();
  fireEvent.change(screen.getByRole('textbox',{name:'Search conversations'}),{target:{value:'not-found-123'}});expect(screen.getByText('No conversations found')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Clear search'}));
  fireEvent.click(screen.getByRole('button',{name:'Options for My unique chat'}));fireEvent.click(screen.getByRole('button',{name:'Rename'}));
  fireEvent.change(screen.getByRole('textbox',{name:'Conversation name'}),{target:{value:'Renamed project'}});fireEvent.click(screen.getByRole('button',{name:'Save name'}));
  fireEvent.click(screen.getByRole('button',{name:'Options for Renamed project'}));fireEvent.click(screen.getByRole('button',{name:'Delete'}));expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Delete conversation'}));expect(screen.getByRole('heading',{name:/How can I help/})).toBeTruthy();
  expect(screen.queryByRole('button',{name:'Options for Renamed project'})).toBeNull();
  const before=JSON.parse(localStorage.getItem('nexa-chats-v1')).chats.length;fireEvent.click(screen.getByRole('button',{name:/New chat/}));expect(JSON.parse(localStorage.getItem('nexa-chats-v1')).chats).toHaveLength(before+1);
 });
 it('persists theme, opens/closes drawer, and supports Enter versus Shift+Enter',async()=>{
  render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Switch to dark mode'}));expect(localStorage.getItem('nexa-theme')).toBe('dark');
  fireEvent.click(screen.getByRole('button',{name:'Open sidebar'}));expect(document.querySelector('.sidebar').classList.contains('is-open')).toBe(true);
  fireEvent.click(screen.getAllByRole('button',{name:'Close sidebar'})[0]);expect(document.querySelector('.sidebar').classList.contains('is-open')).toBe(false);
  const input=screen.getByRole('textbox',{name:'Message Nexa AI'});fireEvent.change(input,{target:{value:'Hello there'}});fireEvent.keyDown(input,{key:'Enter',shiftKey:true});expect(screen.queryByRole('log')).toBeNull();
  fireEvent.keyDown(input,{key:'Enter'});await finish();expect(screen.getByRole('log').textContent).toContain('Hello there');
 });
 it('keeps responses tied to their conversation when switching and cancels on New Chat',async()=>{
  render(<App/>);send('First pending message');const saved=JSON.parse(localStorage.getItem('nexa-chats-v1'));const id=saved.active;
  fireEvent.click(screen.getByRole('button',{name:'React project help'}));await finish();
  expect(JSON.parse(localStorage.getItem('nexa-chats-v1')).chats.find(c=>c.id===id).messages).toHaveLength(2);
  send('Another pending message');fireEvent.click(screen.getByRole('button',{name:/New chat/}));await finish();expect(screen.queryByRole('log')).toBeNull();
 });
 it('supports local attachments, emoji, settings, help, and profile dialogs',async()=>{
  render(<App/>);fireEvent.click(screen.getByRole('button',{name:'Choose emoji'}));fireEvent.click(screen.getByRole('button',{name:'Insert 💡'}));expect(screen.getByRole('textbox',{name:'Message Nexa AI'}).value).toBe('💡');
  fireEvent.change(document.querySelector('input[type=file]'),{target:{files:[new File(['hello'],'notes.txt',{type:'text/plain'})]}});expect(screen.getByText('notes.txt')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Send message'}));await finish();expect(screen.getByRole('log').textContent).toContain('Contents are not analyzed');
  fireEvent.click(screen.getByRole('button',{name:'Settings'}));fireEvent.click(screen.getByRole('button',{name:'Dark mode'}));expect(localStorage.getItem('nexa-theme')).toBe('dark');fireEvent.click(screen.getByRole('button',{name:'Close dialog'}));
  fireEvent.click(screen.getByRole('button',{name:/Help & getting started/}));expect(screen.getByRole('dialog').textContent).toContain('About this demo');fireEvent.keyDown(document,{key:'Escape'});
  fireEvent.click(screen.getByRole('button',{name:/Usman Shah Full Stack Developer/}));expect(screen.getByRole('dialog').textContent).toContain('Personal workspace');
 });
 it('shows a generation error and retries successfully',async()=>{
  const mock=vi.spyOn(engine,'generateMockResponse');render(<App/>);mock.mockImplementationOnce(()=>{throw new Error('Simulated failure');});send('Test retry');await finish();
  expect(screen.getByRole('alert').textContent).toContain('Something went wrong');fireEvent.click(screen.getByRole('button',{name:'Retry'}));await finish();expect(screen.queryByRole('alert')).toBeNull();expect(screen.getByRole('log').textContent).toContain('Test retry');
 });
 it('recovers from malformed storage',()=>{
  localStorage.setItem('nexa-chats-v1','{bad json');render(<App/>);expect(screen.getByRole('heading',{name:/How can I help/})).toBeTruthy();
 });
});
describe('response coverage',()=>{it('answers every category and unknown input',()=>{
 for(const topic of ['Hi','React','JavaScript promise','debug error','business marketing sales','SEO','write content','learning plan','arbitrary input'])expect(generateMockResponse(topic).length).toBeGreaterThan(50);
});});
