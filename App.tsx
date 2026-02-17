
import React, { useState, useEffect, useCallback } from 'react';
import { MoodType, VibeState, Recommendation, Message } from './types';
import { getMoodRecommendations, generateVibeResponse } from './services/geminiService';
import VibeDashboard from './components/VibeDashboard';
import VoiceAgent from './components/VoiceAgent';
import RecommendationCard from './components/RecommendationCard';
import { Send, Smile, Plus, UserCircle, Settings, MessageSquare, Mic, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<VibeState>({
    currentMood: MoodType.NEUTRAL,
    vibeScore: 50,
    history: [{ timestamp: Date.now(), score: 50 }]
  });

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'dash' | 'chat' | 'voice'>('dash');
  const [isLoading, setIsLoading] = useState(false);

  const updateMood = useCallback(async (newMood: MoodType, score: number) => {
    setState(prev => ({
      ...prev,
      currentMood: newMood,
      vibeScore: score,
      history: [...prev.history, { timestamp: Date.now(), score }]
    }));
    
    setIsLoading(true);
    const recs = await getMoodRecommendations(newMood);
    setRecommendations(recs);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    updateMood(MoodType.NEUTRAL, 50);
  }, [updateMood]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: inputText, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    const response = await generateVibeResponse(inputText, state.currentMood);
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: response, timestamp: Date.now() };
    setMessages(prev => [...prev, aiMsg]);
    
    // Simple sentiment analysis simulator based on keywords
    if (inputText.toLowerCase().includes('happy') || inputText.toLowerCase().includes('great')) {
      updateMood(MoodType.HAPPY, Math.min(100, state.vibeScore + 15));
    } else if (inputText.toLowerCase().includes('sad') || inputText.toLowerCase().includes('bad')) {
      updateMood(MoodType.SAD, Math.max(0, state.vibeScore - 15));
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col max-w-md mx-auto bg-slate-950 text-white shadow-2xl">
      {/* Background Blobs */}
      <div className="blob -top-20 -left-20 bg-indigo-500/10"></div>
      <div className="blob top-1/2 -right-20 bg-pink-500/10"></div>
      
      {/* Header */}
      <header className="px-6 py-8 flex justify-between items-center z-10">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text vibe-gradient flex items-center gap-2">
            VibeCheck <Zap className="fill-indigo-500 text-indigo-500" />
          </h1>
          <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase">AI Mood Sanctuary</p>
        </div>
        <div className="flex gap-3">
          <button className="p-2 vibe-glass rounded-full text-indigo-400 hover:text-indigo-200 transition-colors">
            <Settings className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 rounded-full vibe-gradient p-0.5">
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center overflow-hidden">
               <UserCircle className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-6 pb-24 overflow-y-auto z-10 no-scrollbar">
        {activeTab === 'dash' && (
          <div className="animate-in fade-in duration-500">
            <VibeDashboard state={state} />
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Quick Select Mood</h2>
                <button className="text-xs text-indigo-400 hover:underline">Customize</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Object.values(MoodType).map(m => (
                  <button
                    key={m}
                    onClick={() => updateMood(m, m === MoodType.HAPPY ? 90 : 30)}
                    className={`py-3 rounded-2xl vibe-glass text-sm font-semibold transition-all ${
                      state.currentMood === m ? 'vibe-gradient border-none' : 'hover:bg-white/10'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Your Vibe Prescriptions</h2>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 opacity-50">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-40 vibe-glass rounded-2xl animate-pulse"></div>)}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {recommendations.map(rec => (
                  <RecommendationCard key={rec.id} item={rec} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
            <div className="flex-1 space-y-4 mb-6 pt-4">
              {messages.length === 0 && (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold">Start a Conversation</h3>
                  <p className="text-gray-400 text-sm">Tell me how you're feeling, or vent about your day. I'm here to vibe with you.</p>
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    m.role === 'user' ? 'vibe-gradient rounded-tr-none' : 'vibe-glass rounded-tl-none text-indigo-100'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chat Input Stickiness managed by Bottom Nav parent container layout */}
          </div>
        )}

        {activeTab === 'voice' && (
          <div className="pt-8 h-full flex flex-col animate-in slide-in-from-left-4 duration-300">
             <VoiceAgent />
             <div className="mt-8 vibe-glass p-6 rounded-3xl">
               <h4 className="text-sm font-bold text-indigo-300 mb-2">Voice Tips</h4>
               <ul className="text-xs space-y-2 text-gray-400">
                 <li>• Speak naturally, VibeMaster understands nuance.</li>
                 <li>• Try saying "Tell me a roast about my boss."</li>
                 <li>• Ask for a 2-minute breathing exercise.</li>
               </ul>
             </div>
          </div>
        )}
      </main>

      {/* Floating Chat Input (Only on Chat Tab) */}
      {activeTab === 'chat' && (
        <div className="absolute bottom-24 left-0 right-0 px-6 z-20">
          <div className="vibe-glass p-2 rounded-full flex gap-2 border border-white/20">
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Plus className="w-6 h-6" />
            </button>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="How's the vibe?"
              className="flex-1 bg-transparent border-none outline-none text-sm px-2"
            />
            <button 
              onClick={handleSendMessage}
              className="p-2 vibe-gradient rounded-full hover:scale-105 transition-transform"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 max-w-md w-full vibe-glass border-t border-white/10 px-8 py-4 flex justify-between items-center z-30 rounded-t-[2.5rem]">
        <button 
          onClick={() => setActiveTab('dash')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dash' ? 'text-indigo-400 scale-110' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Zap className={`w-6 h-6 ${activeTab === 'dash' ? 'fill-indigo-400/20' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Dash</span>
        </button>
        <button 
          onClick={() => setActiveTab('voice')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'voice' ? 'text-purple-400 scale-110' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Mic className={`w-6 h-6 ${activeTab === 'voice' ? 'fill-purple-400/20' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Voice</span>
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'chat' ? 'text-pink-400 scale-110' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <MessageSquare className={`w-6 h-6 ${activeTab === 'chat' ? 'fill-pink-400/20' : ''}`} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Chat</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
