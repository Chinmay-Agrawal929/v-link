import { create } from 'zustand';

export type UserRole = 'student' | 'faculty' | 'admin';

export type User = {
  name: string;
  graduationYear?: string;
  email: string;
  regNo: string;
  branch: string;
  role: UserRole;
  hasCompletedSetup: boolean;
  headline?: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  coverUrl?: string | null;
  connections: number;
  about: string;
  skills: string[];
  skillEndorsements?: Record<string, string[]>;
  certifications: string[];
  projects?: string[];
  dailyHabits: string[];
  featuredProjects: { title: string; tech: string; type?: string }[];
  githubConnected: boolean;
};

export type Notification = {
  id: string;
  text: string;
  time: string;
};

export type Message = {
  id: string;
  sender: string;
  isOfficial: boolean;
  unread: boolean;
  timestamp: string;
  content?: string;
  lastMessage?: string;
  text?: string;
};

export type Post = {
  id: number;
  author: string;
  role: string;
  time: string;
  avatar: string;
  content?: string;
  code?: string;
  badge?: string;
  badgeIcon?: any;
  repoName?: string;
  likes: number;
  comments: number;
  reposts: number;
  isConnection: boolean;
  isLiked: boolean;
};

const initialUser: User = {
  name: "Manchikanti Shritan",
  email: "",
  regNo: "26BCE5167",
  branch: "B.Tech CSE Core",
  role: "student",
  hasCompletedSetup: false,
  avatarUrl: null,
  bannerUrl: null,
  connections: 0,
  about: "",
  skills: [],
  certifications: [],
  dailyHabits: [],
  featuredProjects: [],
  githubConnected: false
};

const initialPosts: Post[] = [
  {
    id: 1,
    author: 'VIT Developer',
    role: 'B.Tech CSE',
    time: '2h ago',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VIT1',
    content: 'Just hit a 50-day LeetCode streak! 🚀',
    likes: 27,
    comments: 4,
    reposts: 1,
    isConnection: true,
    isLiked: false,
  },
  {
    id: 2,
    author: 'Design Lead',
    role: 'B.Tech ECE',
    time: '5h ago',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Design2',
    content: 'Looking for developers for the DevJams hackathon. DM me!',
    likes: 12,
    comments: 8,
    reposts: 0,
    isConnection: false,
    isLiked: false,
  }
];

type AppState = {
  isAuthenticated: boolean;
  user: User | null;
  activeTab: string;
  isCreateModalOpen: boolean;
  isSettingsModalOpen: boolean;
  draftPostContent: string;
  themeColor: string;
  setThemeColor: (color: string) => void;
  appFont: string;
  setAppFont: (font: string) => void;
  
  // Network & Inbox
  messages: Message[];
  activeNetworkTab: 'network' | 'messages' | 'skills';
  
  // Notifications
  notifications: Notification[];
  addNotification: (text: string) => void;
  removeNotification: (id: string) => void;
  
  globalToast: string | null;
  showGlobalToast: (msg: string) => void;
  hideGlobalToast: () => void;

  // Actions
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  setTab: (tab: string) => void;
  setCreateModalOpen: (isOpen: boolean) => void;
  setSettingsModalOpen: (isOpen: boolean) => void;
  setDraftPostContent: (content: string) => void;
  setNetworkTab: (tab: 'network' | 'messages' | 'skills') => void;
  markMessageRead: (id: string) => void;
  addMessage: (message: Message) => void;
  completeSetup: (data: { regNo: string; branch: string; graduationYear: string; skills: string[]; certs: string[] }) => void;
  updateAvatar: (avatarUrl: string) => void;
  connectGithub: () => void;
  markNotifPrimerSeen: () => void;
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'reposts' | 'isConnection' | 'isLiked' | 'time' | 'avatar'>) => void;
  toggleLike: (id: number) => void;
  loadMorePosts: (newPosts: Post[]) => void;
};

const initialMessages: Message[] = [
  {
    id: "admin-1",
    sender: "v-link Admins",
    isOfficial: true,
    unread: true,
    timestamp: "Just now",
    content: "Welcome to v-link, Manchikanti! \n\nWe built this platform exclusively for VIT Chennai students to bridge the gap between professional networking and open-source collaboration.\n\nSince your profile is new, start by uploading an image of yourself and linking your GitHub. If you need any help, tap the AI Counsellor icon at the bottom right."
  }
];

const initialNotifications: Notification[] = [];

export const useAppStore = create<AppState>((set) => ({
  themeColor: "#0A66C2",
  appFont: "\"Inter\", \"Roboto\", sans-serif",
  setThemeColor: (color) => set({ themeColor: color }),
  setAppFont: (font) => set({ appFont: font }),
  isAuthenticated: false,
  user: null,
  activeTab: 'home',
  isCreateModalOpen: false,
  isSettingsModalOpen: false,
  draftPostContent: "",
  
  messages: initialMessages,
  activeNetworkTab: 'network',

  notifications: initialNotifications,
  addNotification: (text) => set((state) => ({
    notifications: [{ id: Date.now().toString(), text, time: 'Just now' }, ...state.notifications]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  globalToast: null,
  showGlobalToast: (msg) => {
    set({ globalToast: msg });
    setTimeout(() => {
      set((state) => (state.globalToast === msg ? { globalToast: null } : state));
    }, 3000);
  },
  hideGlobalToast: () => set({ globalToast: null }),

  login: (email, role) => {
    set({
      isAuthenticated: true,
      user: {
        ...initialUser,
        email,
        regNo: role === 'student' ? initialUser.regNo : "FAC-1002",
        role,
      },
      messages: initialMessages,
      activeNetworkTab: 'network'
    });
  },
  logout: () => set({ isAuthenticated: false, user: null }),
  setTab: (tab) => set({ activeTab: tab }),
  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),
  setSettingsModalOpen: (isOpen) => set({ isSettingsModalOpen: isOpen }),
  setDraftPostContent: (content) => set({ draftPostContent: content }),
  setNetworkTab: (tab) => set({ activeNetworkTab: tab }),
  markMessageRead: (id) => set((state) => ({
    messages: state.messages.map(m => m.id === id ? { ...m, unread: false } : m)
  })),
  addMessage: (message) => set((state) => ({
    messages: [message, ...state.messages]
  })),
  completeSetup: (data) => set((state) => ({
    user: state.user ? {
      ...state.user,
      regNo: data.regNo,
      branch: data.branch,
      graduationYear: data.graduationYear,
      skills: data.skills,
      certifications: data.certs,
      hasCompletedSetup: true
    } : null
  })),
  updateAvatar: (avatarUrl) => set((state) => ({
    user: state.user ? {
      ...state.user,
      avatarUrl
    } : null
  })),
  connectGithub: () => set((state) => ({
    user: state.user ? {
      ...state.user,
      githubConnected: true
    } : null
  })),
  posts: initialPosts,
  addPost: (post) => set((state) => ({
    posts: [{
      ...post,
      id: Date.now(),
      likes: 0,
      comments: 0,
      reposts: 0,
      isConnection: false,
      isLiked: false,
      time: 'Just now',
      avatar: state.user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
    }, ...state.posts]
  })),
  toggleLike: (id) => set((state) => ({
    posts: state.posts.map(p => 
      p.id === id 
        ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } 
        : p
    )
  })),
  loadMorePosts: (newPosts) => set((state) => ({
    posts: [...state.posts, ...newPosts]
  })),
  markNotifPrimerSeen: () => set({})
}));
