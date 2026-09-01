import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { motion, AnimatePresence } from 'motion/react';
import { Menu,  Home, Users, PlusSquare, Briefcase, User as UserIcon, MessageSquare, Link, Calendar, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import Tabs
import HomeTab from '@/tabs/HomeTab';
import NetworkTab from '@/tabs/NetworkTab';
import SpotlightTab from '@/tabs/SpotlightTab';
import ProfileTab from '@/tabs/ProfileTab';
import PlannerTab from '@/tabs/PlannerTab';
import LibraryTab from '@/tabs/LibraryTab';
import MyTeamsScreen from '@/screens/MyTeamsScreen';
import AiOracle from '@/components/AiOracle';
import CreatePostModal from '@/components/CreatePostModal';
import ProfileSetupWizard from '@/components/ProfileSetupWizard';
import SideDrawer from '@/components/SideDrawer';
import SettingsModal from '@/components/SettingsModal';
import GlobalSearch from '@/components/GlobalSearch';

const TABS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'network', icon: Users, label: 'Network' },
  { id: 'create', icon: PlusSquare, label: 'Post' },
  { id: 'spotlight', icon: Briefcase, label: 'Spotlight' },
  { id: 'profile', icon: UserIcon, label: 'Profile' },
];

export default function MainLayout() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { user, activeTab, setTab, setCreateModalOpen, messages, setNetworkTab, isSettingsModalOpen, setSettingsModalOpen } = useAppStore();

  const unreadMessagesCount = messages.filter(m => m.unread).length;

  const handleTabClick = (tabId: string) => {
    if (tabId === 'create') {
      setCreateModalOpen(true);
    } else {
      setTab(tabId);
    }
  };

  const openMessages = () => {
    setTab('network');
    setNetworkTab('messages');
  };

  return (
    <div className="relative w-full h-[100dvh] flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="glass-panel h-14 flex items-center px-4 shrink-0 z-20 m-4 rounded-2xl">
        <button onClick={() => setDrawerOpen(true)} className="flex-shrink-0 mr-3 text-gray-400 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-shrink-0 mr-3 hidden sm:flex items-center justify-center">
          <Link size={28} color="#0084FF" strokeWidth={3} />
        </div>
        <GlobalSearch />
        <button onClick={openMessages} className="ml-4 relative text-gray-400 hover:text-white transition-colors shrink-0">
          <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} alt="Messages" className="w-8 h-8 rounded-full border border-gray-600 bg-white/5 object-cover" />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-blue text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-brand-dark">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full h-full relative z-10 overflow-hidden pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <HomeTab key="home" />}
          {activeTab === 'network' && <NetworkTab key="network" />}
          {activeTab === 'spotlight' && <SpotlightTab key="spotlight" />}
          {activeTab === 'library' && <LibraryTab key="library" />}
          {activeTab === 'planner' && <PlannerTab key="planner" />}
          {activeTab === 'profile' && <ProfileTab key="profile" />}
          {activeTab === 'teams' && <MyTeamsScreen key="teams" />}
        </AnimatePresence>
      </div>
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} />

      {/* Floating Action Button (AI) */}
      <AiOracle />
      
      {/* Modals */}
      <CreatePostModal />

      {/* Setup Wizard (Appears for new users) */}
      {user && !user.hasCompletedSetup && <ProfileSetupWizard />}

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pb-safe">
        <div className="glass-panel mx-4 mb-4 rounded-3xl flex items-center justify-between px-2 py-2 relative">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id && tab.id !== 'create';
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="flex flex-col items-center justify-center flex-1 h-14 transition-colors relative rounded-2xl"
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-bg"
                    className="absolute inset-0 bg-white/10 rounded-2xl -z-10"
                  />
                )}
                <Icon 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={cn(
                    "w-6 h-6 transition-colors", 
                    isActive ? "text-white" : "text-gray-500"
                  )} 
                />
                <span className={cn(
                  "text-[10px] mt-1 font-medium transition-colors",
                  isActive ? "text-white" : "text-gray-500"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
