
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { VibeState, MoodType } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VibeDashboardProps {
  state: VibeState;
}

const VibeDashboard: React.FC<VibeDashboardProps> = ({ state }) => {
  const getTrendIcon = () => {
    if (state.history.length < 2) return <Minus className="text-gray-400" />;
    const last = state.history[state.history.length - 1].score;
    const prev = state.history[state.history.length - 2].score;
    if (last > prev) return <TrendingUp className="text-green-400" />;
    if (last < prev) return <TrendingDown className="text-red-400" />;
    return <Minus className="text-gray-400" />;
  };

  const getMoodEmoji = (mood: MoodType) => {
    switch (mood) {
      case MoodType.HAPPY: return '🌟';
      case MoodType.SAD: return '🌧️';
      case MoodType.ANGRY: return '🔥';
      case MoodType.ANXIOUS: return '🌀';
      case MoodType.BORED: return '💤';
      default: return '😐';
    }
  };

  return (
    <div className="vibe-glass rounded-3xl p-6 mb-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-1">Current Energy</h2>
          <div className="flex items-center gap-3">
            <span className="text-5xl font-bold">{state.vibeScore}%</span>
            <div className="flex flex-col">
              <span className="text-xl">{getMoodEmoji(state.currentMood)}</span>
              {getTrendIcon()}
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider mb-1">Vibe State</h2>
          <span className="text-xl font-bold text-white bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
            {state.currentMood}
          </span>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={state.history}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="timestamp" hide />
            <YAxis hide domain={[0, 100]} />
            <Tooltip 
              contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px' }}
              labelStyle={{ display: 'none' }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#a855f7" 
              strokeWidth={4} 
              dot={false}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VibeDashboard;
