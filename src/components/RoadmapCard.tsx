import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Calendar, CheckSquare, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  role: string;
  task: string;
}

interface Milestone {
  week: number;
  title: string;
  tasks: Task[];
}

interface RoadmapCardProps {
  roadmap: {
    project_goal: string;
    milestones: Milestone[];
  };
}

export default function RoadmapCard({ roadmap }: RoadmapCardProps) {
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);

  return (
    <div className="bg-brand-dark/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden backdrop-blur-md shadow-xl mt-4">
      <div className="flex items-start gap-3 border-b border-white/10 pb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-blue/20 flex items-center justify-center shrink-0 border border-brand-blue/30">
          <Target className="w-5 h-5 text-brand-blue" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">Project Roadmap</h4>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{roadmap.project_goal}</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        {roadmap.milestones.map((milestone) => {
          const isExpanded = expandedWeek === milestone.week;
          return (
            <div key={milestone.week} className="border border-white/5 rounded-xl overflow-hidden bg-white/5">
              <button 
                onClick={() => setExpandedWeek(isExpanded ? null : milestone.week)}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-white/10 text-brand-blue text-[10px] font-bold px-2 py-0.5 rounded">
                    WEEK {milestone.week}
                  </div>
                  <span className="font-semibold text-white text-sm">{milestone.title}</span>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 pt-0 border-t border-white/5 flex flex-col gap-2">
                      {milestone.tasks.map((t, idx) => (
                        <div key={idx} className="flex gap-2 items-start bg-black/20 p-2.5 rounded-lg">
                          <CheckSquare className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-brand-blue font-bold mb-0.5">{t.role}</p>
                            <p className="text-xs text-gray-300 leading-relaxed">{t.task}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
