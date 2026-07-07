import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { useChatStore } from './store/chatStore';

function App() {
  const fetchConversations = useChatStore(state => state.fetchConversations);
  const { glassBlur, glassOpacity, hasGlow, isLight } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div
      className={`flex h-screen w-full overflow-hidden relative transition-colors duration-300 ${isLight ? 'bg-slate-50 text-slate-900 light-theme' : 'bg-nova-dark text-slate-200'
        }`}
      style={{
        '--glass-blur': `${glassBlur}px`,
        '--glass-opacity': `${glassOpacity / 100}`,
      } as React.CSSProperties}
    >
      {/* Background Neon Glow Objects */}
      {hasGlow && !isLight && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-nova-accent/10 rounded-full blur-[120px] pointer-events-none animate-pulse-subtle" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse-subtle" />
          <div className="absolute top-[35%] right-[15%] w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
        </>
      )}

      {hasGlow && isLight && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-sky-500/5 rounded-full blur-[150px] pointer-events-none" />
        </>
      )}

      <Sidebar />
      <main className="flex-1 flex flex-col relative h-[calc(100vh-16px)] glass-panel m-2 rounded-2xl overflow-hidden border shadow-2xl transition-all">
        <ChatWindow />
      </main>
    </div>
  );
}

export default App;
