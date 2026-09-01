import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Check, Trash2, BookOpen, Loader2, X } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface Plan {
  id: string;
  title: string;
  subject: string;
  tasks: Task[];
  date: string;
  createdAt: any;
}

export default function PlannerTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // New plan form
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newTasks, setNewTasks] = useState<string[]>(['']);
  
  const { showGlobalToast } = useAppStore();

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, `users/${auth.currentUser.uid}/study_plans`),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPlans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Plan[];
      setPlans(loadedPlans);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleCreatePlan = async () => {
    if (!newTitle.trim() || !newSubject.trim()) return;
    if (!auth.currentUser) return;
    
    const validTasks = newTasks.filter(t => t.trim() !== '').map(text => ({
      id: Math.random().toString(36).substr(2, 9),
      text,
      completed: false
    }));

    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/study_plans`), {
        title: newTitle,
        subject: newSubject,
        tasks: validTasks,
        date: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
      
      setNewTitle('');
      setNewSubject('');
      setNewTasks(['']);
      setIsAdding(false);
      showGlobalToast('Study plan created!');
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTask = async (planId: string, taskId: string, currentTasks: Task[]) => {
    if (!auth.currentUser) return;
    const updatedTasks = currentTasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    
    try {
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/study_plans`, planId), {
        tasks: updatedTasks
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/study_plans`, planId));
      showGlobalToast('Study plan deleted');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto px-4 pb-24 no-scrollbar">
      <div className="flex items-center justify-between mb-6 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Study Planner</h1>
          <p className="text-gray-400 text-sm">Organize your academic goals</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-10 h-10 rounded-full bg-brand-blue flex items-center justify-center text-white shadow-lg shadow-brand-blue/30 active:scale-95 transition-all shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="glass-panel p-5 rounded-3xl mb-6 border border-brand-blue/30 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">New Study Plan</h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Plan Title (e.g., Midterm Prep)" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
              />
              
              <input 
                type="text" 
                placeholder="Subject (e.g., Data Structures)" 
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue"
              />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Tasks</label>
                {newTasks.map((task, index) => (
                  <div key={index} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={`Task ${index + 1}`} 
                      value={task}
                      onChange={e => {
                        const updated = [...newTasks];
                        updated[index] = e.target.value;
                        setNewTasks(updated);
                      }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue text-sm"
                    />
                    {index === newTasks.length - 1 && task.trim() !== '' && (
                      <button 
                        onClick={() => setNewTasks([...newTasks, ''])}
                        className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={handleCreatePlan}
                disabled={!newTitle.trim() || !newSubject.trim()}
                className="w-full py-3 rounded-xl bg-brand-blue text-white font-bold disabled:opacity-50 mt-2"
              >
                Create Plan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-300 font-medium mb-1">No study plans yet</p>
          <p className="text-gray-500 text-sm max-w-[200px]">Create your first plan to start tracking your academic goals.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => {
            const completedCount = plan.tasks.filter(t => t.completed).length;
            const progress = plan.tasks.length === 0 ? 0 : Math.round((completedCount / plan.tasks.length) * 100);
            
            return (
              <div key={plan.id} className="glass-panel p-5 rounded-3xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-brand-blue/20 text-brand-blue text-[10px] font-bold uppercase tracking-wider border border-brand-blue/30">
                        {plan.subject}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-lg">{plan.title}</h3>
                  </div>
                  <button 
                    onClick={() => handleDeletePlan(plan.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="w-full h-1.5 bg-white/10 rounded-full mb-4 overflow-hidden flex items-center">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-brand-green"
                  />
                </div>
                
                <div className="space-y-2 mt-4">
                  {plan.tasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => handleToggleTask(plan.id, task.id, plan.tasks)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98]",
                        task.completed 
                          ? "bg-brand-green/10 border-brand-green/30" 
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full border flex items-center justify-center shrink-0",
                        task.completed ? "bg-brand-green border-brand-green text-black" : "border-gray-500"
                      )}>
                        {task.completed && <Check className="w-3 h-3" />}
                      </div>
                      <span className={cn(
                        "text-sm",
                        task.completed ? "text-brand-green line-through opacity-70" : "text-gray-200"
                      )}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
