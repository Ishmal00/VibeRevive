
import React from 'react';
import { Recommendation } from '../types';
// Fix: Added Sparkles to the lucide-react import list.
import { PlayCircle, Dumbbell, Laugh, Quote, Flame, BookOpen, Sparkles } from 'lucide-react';

interface RecommendationCardProps {
  item: Recommendation;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ item }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'activity': return <PlayCircle className="text-blue-400" />;
      case 'exercise': return <Dumbbell className="text-green-400" />;
      case 'joke': return <Laugh className="text-yellow-400" />;
      case 'roast': return <Flame className="text-orange-400" />;
      case 'quote': return <Quote className="text-purple-400" />;
      case 'story': return <BookOpen className="text-indigo-400" />;
      default: return <Sparkles className="text-white" />;
    }
  };

  const getIntensityColor = () => {
    switch (item.intensity) {
      case 'low': return 'text-green-400 bg-green-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'high': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="vibe-glass rounded-2xl p-5 hover:border-indigo-500/50 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
          {getIcon()}
        </div>
        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${getIntensityColor()}`}>
          {item.intensity} Energy
        </span>
      </div>
      <h3 className="font-bold text-lg mb-2 leading-tight">{item.title}</h3>
      <p className="text-sm text-gray-400 line-clamp-3 mb-4">{item.content}</p>
      <button className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-300 hover:text-white rounded-xl text-sm font-semibold transition-all">
        Try This Vibe
      </button>
    </div>
  );
};

export default RecommendationCard;
