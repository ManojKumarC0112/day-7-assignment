import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { useChatStore } from './store/chatStore';

function App() {
  const fetchConversations = useChatStore(state => state.fetchConversations);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="flex h-screen w-full overflow-hidden text-slate-200">
      <Sidebar />
      <main className="flex-1 flex flex-col relative h-full glass-panel m-2 rounded-2xl overflow-hidden">
        <ChatWindow />
      </main>
    </div>
  );
}

export default App;
