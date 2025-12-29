import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Search, Send, MessageSquare, UserPlus, Users, Bell, Check, ChevronLeft, Ghost, RefreshCw, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { toast } from "sonner"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  isGroup?: boolean;
  groupName?: string;
}

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt?: string;
}

interface FriendRequest {
  _id: string;
  from: User;
  status: 'pending' | 'accepted' | 'rejected';
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Chat = () => {
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 'FRIENDS' | 'REQUESTS' | 'SEARCH' | 'ANONYMOUS'
  const [activeTab, setActiveTab] = useState<'FRIENDS' | 'REQUESTS' | 'SEARCH' | 'ANONYMOUS'>('FRIENDS');

  // Anonymous Chat State
  const [anonStatus, setAnonStatus] = useState<'IDLE' | 'SEARCHING' | 'MATCHED'>('IDLE');
  const [anonRoomId, setAnonRoomId] = useState<string | null>(null);
  const [anonMessages, setAnonMessages] = useState<Message[]>([]);

  const [selectedChat, setSelectedChat] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const anonEndRef = useRef<HTMLDivElement>(null);
  const selectedChatRef = useRef<User | null>(null);
  
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    anonEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, anonMessages]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  /* ---------------- SOCKET SETUP ---------------- */
  useEffect(() => {
    if (!user) return;

    const socketUrl = import.meta.env.VITE_API_URL 
      ? new URL(import.meta.env.VITE_API_URL).origin 
      : 'http://localhost:3000';

    socketRef.current = io(socketUrl, { 
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10
    });

    socketRef.current.on('connect', () => {
        setIsConnected(true);
        console.log('socket connected');
        socketRef.current?.emit('joinRoom', user._id);
    });

    socketRef.current.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
    });

    socketRef.current.on('disconnect', () => {
        setIsConnected(false);
        console.log('socket disconnected');
    });

    // STANDARD CHAT
    socketRef.current.on('receiveMessage', (msg: Message) => {
      const activeChat = selectedChatRef.current;
      const isFromActiveChat = activeChat && (msg.senderId === activeChat._id || msg.senderId === user._id);
      
      if (isFromActiveChat) {
         setMessages(prev => {
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
         });
      }
    });

    // ANONYMOUS CHAT
    socketRef.current.on('anonymousMatched', ({ roomId }) => {
        setAnonRoomId(roomId);
        setAnonStatus('MATCHED');
        setAnonMessages([{
            senderId: 'SYSTEM',
            receiverId: 'ALL',
            content: 'You are matched! Say Hi.',
            createdAt: new Date().toISOString()
        }]);
    });

    socketRef.current.on('receiveAnonymousMessage', (msg: any) => {
        console.log('Frontend received anonymous msg:', msg);
        setAnonMessages(prev => [...prev, msg]);
    });

    // FRIEND REQUESTS
    socketRef.current.on('newFriendRequest', (request: any) => {
        setRequests(prev => [request, ...prev]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user?._id]);

  /* ---------------- FETCH INITIAL DATA ---------------- */
  useEffect(() => {
    const fetchProfileAndData = async () => {
      try {
        const profileRes = await api.get('/auth/profile');
        setUser(profileRes.data.user);

        const friendsRes = await api.get('/friends');
        setFriends(friendsRes.data.data);

        const repoRes = await api.get('/friends/requests');
        setRequests(repoRes.data.data);

      } catch {
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndData();
  }, [navigate]);

  /* ---------------- FRIEND ACTIONS ---------------- */
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
        setSearchResults([]);
        return;
    }
    try {
        const res = await api.get(`/friends/search?query=${query}`);
        setSearchResults(res.data.data);
    } catch (err) {
        console.error(err);
    }
  };

  const handleSendRequest = async (targetId: string) => {
    try {
        await api.post('/friends/request', { userId: targetId });
        toast.success('Friend request sent!');
        setSearchResults(prev => prev.filter(u => u._id !== targetId));
    } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
        await api.post('/friends/accept', { requestId });
        
        const friendsRes = await api.get('/friends');
        setFriends(friendsRes.data.data);

        const repoRes = await api.get('/friends/requests');
        setRequests(repoRes.data.data);

        setActiveTab('FRIENDS');
    } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed");
    }
  };


  const handleRemoveFriend = async (friendId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(!confirm("Are you sure you want to remove this friend?")) return;

    try {
        await api.post('/friends/remove', { friendId });
        setFriends(prev => prev.filter(f => f._id !== friendId));
        if (selectedChat?._id === friendId) setSelectedChat(null);
    } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to remove friend");
    }
  };

  /* ---------------- GROUP ACTIONS ---------------- */
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<string[]>([]);

  const handleCreateGroup = async () => {
      if (!groupName.trim() || selectedFriendsForGroup.length < 2) {
          toast.error("Please enter a group name and select at least 2 friends.");
          return;
      }
      try {
          const res = await api.post('/chats/group', {
              name: groupName,
              users: JSON.stringify(selectedFriendsForGroup)
          });
          
          if(res.status === 200) {
              toast.success("Group created successfully!");
              setIsGroupDialogOpen(false);
              setGroupName("");
              setSelectedFriendsForGroup([]);
              
              const newGroup = res.data;
              // Add to friends list temporarily or refetch (Group chats usually in separate list or mixed)
              // For simplicity, we can fetch all chats, but here we might just reload or add to a mixed list if we had one.
              // Since we are showing 'friends', we need a way to show groups. 
              // Let's add the new group to the 'FRIENDS' list but mark it.
              setFriends(prev => [newGroup, ...prev]);
          }
      } catch (err: any) {
         toast.error(err.response?.data?.message || "Failed to create group");
      }
  };

  const toggleFriendSelection = (friendId: string) => {
      setSelectedFriendsForGroup(prev => 
          prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
      );
  };

  /* ---------------- ANONYMOUS ACTIONS ---------------- */
  const startAnonymous = () => {
    setAnonStatus('SEARCHING');
    setAnonMessages([]);
    socketRef.current?.emit('startAnonymous');
  };

  const stopAnonymous = () => {
      setAnonStatus('IDLE');
      setAnonRoomId(null);
      socketRef.current?.emit('stopAnonymous');
  };

  const sendAnonymousMessage = () => {
      if(!message.trim() || !anonRoomId) return;
      
      const msg = {
          content: message,
          senderId: 'ME',
          receiverId: 'PARTNER',
          createdAt: new Date().toISOString()
      };

      setAnonMessages(prev => [...prev, msg]);
      socketRef.current?.emit('sendAnonymousMessage', { roomId: anonRoomId, content: message });
      setMessage('');
  };

  /* ---------------- CHAT ACTIONS ---------------- */
  useEffect(() => {
    if (activeTab === 'ANONYMOUS') return;
    if (!selectedChat || !user) return;

    const fetchChatHistory = async () => {
      try {
        let res;
        if (selectedChat.isGroup) {
             // Fetch by ChatID directly or use a new endpoint. 
             // We can assume user is selectedChat here is actually the Chat Object for groups.
             // But existing /chats endpoint expects userId2. 
             // We configured GET /chats/:userId to getting all chats. 
             // We need a way to get messages for a specific group. 
             // Actually, chatController.js 'getOrCreateChat' is what /chats calls (POST /api/chats).
             // That finds 1-to-1. 
             // We need to fetch messages for the group. 
             // Let's assume we can use the same endpoint if we pass chatId? 
             // No, getOrCreateChat takes userId2.
             // We need to add a way to get messages for a chat ID.
             // Ideally we should have a route GET /messages/:chatId.
             // For now, let's use the socket or add a route? 
             // Let's check backend chatController. getMessages is exported but no route attached?
             // Ah, we missed adding GET /api/messages/:chatId route in backend plan.
             // Let's quickly add it or re-use.
             // Wait, `getMessages` IS in controller but not in route.
             // Let's fix backend route first or use a trick.
             // Actually, verify implementation plan. We didn't add the route.
             // Let's add it now in Chat.tsx assuming we will fix backend in next step or now.
             // We will assume GET /api/chats/:chatId/messages exists or similar.
             // Let's use POST /api/chats with chatId? No.
             // Let's fetch the chat object which includes messages. 
             // Actually `getOrCreateChat` returns populated chat!
             // So for 1-on-1 we call that.
             // For Group, we ALREADY have the object if we clicked it from list? 
             // If the list item is the CHAT object, it might have messages if populated.
             // But typically we fetch history on click.
             // Let's add a `fetchGroupMessages` function.
             res = await api.get(`/chats/${selectedChat._id}/messages`);
        } else {
             res = await api.post('/chats', {
               userId2: selectedChat._id
             });
        }
        
        const messagesData = selectedChat.isGroup ? res.data.data : res.data.data.messages;

        const history = messagesData.map((m: any) => ({
            _id: m._id,
            senderId: m.sender?._id || m.sender || 'unknown',
            receiverId: m.receiver?._id || m.receiver || 'unknown',
            content: m.content || '',
            createdAt: m.createdAt
        }));
        
        setMessages(history);
      } catch (err) {
        console.error("Failed to fetch chat history", err);
      }
    };

    fetchChatHistory();
  }, [selectedChat, user, activeTab]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    if (activeTab === 'ANONYMOUS' && anonStatus === 'MATCHED') {
        sendAnonymousMessage();
        return;
    }

    if (!selectedChat) return;

    try {
        const payload: any = { content: message };
        
        if (selectedChat.isGroup) {
            payload.chatId = selectedChat._id;
            payload.senderId = user._id; // optional if backend extracts from token
        } else {
            payload.senderId = user._id;
            payload.receiverId = selectedChat._id;
        }

        const res = await api.post('/messages', payload);

        if (res.status === 201) {
            const newMessage = res.data.data;
            setMessages(prev => [...prev, newMessage]);
            setMessage('');
        }
    } catch (err: any) {
        toast.error(`Failed to send: ${err.response?.data?.message}`);
    }
  };

  const handleLogout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Mobile Logic
  const isAnonMode = activeTab === 'ANONYMOUS';
  const showMainPanelMobile = selectedChat !== null || isAnonMode;
  const showSidebarMobile = !showMainPanelMobile;

  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="h-screen w-screen overflow-hidden relative flex bg-background">
      
      {/* ---------------- SIDEBAR ---------------- */}
      <div className={`${showSidebarMobile ? 'flex' : 'hidden'} md:flex w-full md:w-[30%] lg:w-[25%] bg-[var(--message-incoming)] flex-col border-r border-[#FBEFEF]`}>
        
        {/* HEADER */}
        <div className="h-[70px] flex items-center justify-between px-6 border-b border-[#FBEFEF] flex-shrink-0 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsDialogOpen(!isDialogOpen)}>
            <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={user?.avatar} className="object-cover" />
                    <AvatarFallback>{user?.username[0]}</AvatarFallback>
                </Avatar>
                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${isConnected ? 'bg-green-500':'bg-red-500'}`}></span>
            </div>
             <AnimatePresence>
                {isDialogOpen && (
                    <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={(e) => { e.stopPropagation(); setIsDialogOpen(false); }}
                    >
                         <Card className="p-6 w-64 shadow-2xl" onClick={e => e.stopPropagation()}>
                             <p className="font-bold text-lg">{user?.username}</p>
                             <Button variant="destructive" onClick={handleLogout} className="mt-4 w-full">Sign Out</Button>
                         </Card>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
          <div className="flex gap-1">
            <Button 
                variant="ghost"
                size="icon"
                onClick={() => setIsGroupDialogOpen(true)}
                className="text-gray-500 hover:text-purple-600"
            >
                <Plus size={20} />
            </Button>
            <Button 
                variant={activeTab === 'SEARCH' ? "secondary" : "ghost"}
                size="icon"
                onClick={() => { setActiveTab('SEARCH'); setSelectedChat(null); }}
                className={activeTab === 'SEARCH' ? 'bg-[var(--primary-color)] text-[var(--animated-dots)] shadow-sm' : 'text-gray-500'}
            >
                <UserPlus size={20} />
            </Button>
            <Button 
                variant={activeTab === 'REQUESTS' ? "secondary" : "ghost"}
                size="icon"
                onClick={() => { setActiveTab('REQUESTS'); setSelectedChat(null); }}
                className={`relative ${activeTab === 'REQUESTS' ? 'bg-[var(--primary-color)] text-[var(--animated-dots)] shadow-sm' : 'text-gray-500'}`}
            >
                <Bell size={20} />
                {requests.length > 0 && <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse"/>}
            </Button>
            <Button 
                variant={activeTab === 'FRIENDS' ? "secondary" : "ghost"}
                size="icon"
                onClick={() => { setActiveTab('FRIENDS'); setSelectedChat(null); }}
                className={activeTab === 'FRIENDS' ? 'bg-[var(--primary-color)] text-[var(--animated-dots)] shadow-sm' : 'text-gray-500'}
            >
                <Users size={20} />
            </Button>
            <Button 
                variant={activeTab === 'ANONYMOUS' ? "secondary" : "ghost"}
                size="icon"
                onClick={() => { setActiveTab('ANONYMOUS'); setSelectedChat(null); }}
                className={activeTab === 'ANONYMOUS' ? 'bg-purple-100 text-purple-600 shadow-sm' : 'text-gray-500'}
            >
                <Ghost size={20} />
            </Button>
          </div>
        </div>
        
        {/* DESKTOP PROFILE DIALOG */}
        <AnimatePresence>
          {isDialogOpen && (
             <motion.div
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="absolute top-[70px] z-50 left-0 w-64 md:block hidden ml-4 mt-2"
             >
                <Card className="p-4 shadow-xl border-gray-100">
                    <p className="font-bold text-gray-800">{user?.username}</p>
                    <p className="text-xs text-gray-500 mb-3">{user?.email}</p>
                    <Button variant="destructive" onClick={handleLogout} className="w-full h-8 text-xs">Sign Out</Button>
                </Card>
             </motion.div>
          )}
        </AnimatePresence>

        {/* GROUP CREATION DIALOG */}
        <AnimatePresence>
            {isGroupDialogOpen && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setIsGroupDialogOpen(false)}>
                   <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-2xl w-[90%] md:w-[400px] p-6 shadow-2xl overflow-hidden" 
                        onClick={e => e.stopPropagation()}
                   >
                       <h2 className="text-xl font-bold mb-4">Create New Group</h2>
                       <div className="space-y-4">
                           <div>
                               <label className="text-xs font-semibold text-gray-500 uppercase">Group Name</label>
                               <Input 
                                    value={groupName} 
                                    onChange={e => setGroupName(e.target.value)}
                                    placeholder="e.g. Weekend Trip"
                                    className="mt-1"
                               />
                           </div>
                           <div>
                               <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Select Members</label>
                               <ScrollArea className="h-48 border rounded-xl p-2">
                                   {friends.filter(f => !f.isGroup).map(friend => (
                                       <div 
                                            key={friend._id} 
                                            onClick={() => toggleFriendSelection(friend._id)}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${selectedFriendsForGroup.includes(friend._id) ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50'}`}
                                       >
                                           <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedFriendsForGroup.includes(friend._id) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                                               {selectedFriendsForGroup.includes(friend._id) && <Check size={12} className="text-white"/>}
                                           </div>
                                           <Avatar className="h-8 w-8">
                                                <AvatarImage src={friend.avatar} />
                                                <AvatarFallback>{friend.username[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium">{friend.username}</span>
                                       </div>
                                   ))}
                               </ScrollArea>
                               <p className="text-xs text-right mt-1 text-gray-400">{selectedFriendsForGroup.length} selected</p>
                           </div>
                           <Button onClick={handleCreateGroup} className="w-full bg-black hover:bg-gray-800 text-white" disabled={!groupName || selectedFriendsForGroup.length < 2}>
                               Create Group
                           </Button>
                       </div>
                   </motion.div>
               </div>
            )}
        </AnimatePresence>

        {/* LIST CONTENT */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
            
            {/* ANONYMOUS TAB INFO */}
            {activeTab === 'ANONYMOUS' && (
                <div className="p-6 text-center space-y-4">
                    <div className="h-24 w-24 bg-purple-100 rounded-full mx-auto flex items-center justify-center mb-4">
                        <Ghost size={48} className="text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Incognito Mode</h3>
                    <p className="text-sm text-muted-foreground">Chat with strangers randomly. Identities are hidden.</p>
                </div>
            )}

            {/* FRIENDS LIST */}
            {activeTab === 'FRIENDS' && friends.length === 0 && (
                 <div className="flex flex-col items-center justify-center pt-10 text-center opacity-60">
                     <Users size={32} className="mb-2" />
                     <p className="text-sm">No friends yet.</p>
                     <Button variant="link" onClick={() => setActiveTab('SEARCH')} className="text-xs">Find someone?</Button>
                 </div>
            )}
            {activeTab === 'FRIENDS' && friends.map(u => (
                <div key={u._id} onClick={() => setSelectedChat(u)} className={`flex items-center justify-between p-3 mb-1 rounded-xl cursor-pointer hover:bg-[var(--secondary-color)] transition-all ${selectedChat?._id === u._id ? 'bg-[var(--message-outgoing)] shadow-sm ring-1 ring-[#D97B7B]/20' : ''}`}>
                    <div className="flex items-center gap-4">
                        {u.isGroup ? (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white">
                                <Users size={18} className="text-indigo-600"/>
                            </div>
                        ) : (
                            <Avatar className="h-10 w-10 border border-white">
                                <AvatarImage src={u.avatar} className="object-cover" />
                                <AvatarFallback>{u.username?.[0]}</AvatarFallback>
                            </Avatar>
                        )}
                        <div>
                            <p className="font-semibold text-sm text-gray-800">{u.isGroup ? u.groupName : u.username}</p>
                            {!u.isGroup && <p className="text-xs text-green-500">Online</p>}
                            {u.isGroup && <p className="text-xs text-gray-400">Group</p>}
                        </div>
                    </div>
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                        onClick={(e) => handleRemoveFriend(u._id, e)}
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            ))}

            {/* REQUESTS */}
            {activeTab === 'REQUESTS' && requests.length === 0 && (
                 <div className="flex flex-col items-center justify-center pt-10 text-center opacity-60">
                     <Bell size={32} className="mb-2" />
                     <p className="text-sm">No pending requests.</p>
                 </div>
            )}
            {activeTab === 'REQUESTS' && requests.map(req => (
                <div key={req._id} className="flex items-center justify-between p-3 mb-1 bg-white border border-gray-50 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                             <AvatarImage src={req.from.avatar} />
                             <AvatarFallback>{req.from.username[0]}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold text-sm text-gray-800">{req.from.username}</p>
                    </div>
                    <Button onClick={() => handleAcceptRequest(req._id)} size="sm" className="h-8 w-8 rounded-full bg-green-500 hover:bg-green-600 p-0 text-white">
                        <Check size={16} />
                    </Button>
                </div>
            ))}

            {/* SEARCH */}
            {activeTab === 'SEARCH' && (
                <div className="px-2">
                     <div className="flex items-center bg-white rounded-xl px-4 py-2 border mb-4 shadow-sm">
                        <Search className="text-gray-400 mr-2" size={18} />
                        <input 
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="bg-transparent flex-1 focus:outline-none text-sm placeholder:text-muted-foreground" 
                            placeholder="Find username..."
                            autoFocus
                        />
                    </div>
                    {searchResults.map(u => (
                        <div key={u._id} className="flex items-center justify-between p-3 mb-1 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                     <AvatarImage src={u.avatar} />
                                     <AvatarFallback>{u.username[0]}</AvatarFallback>
                                </Avatar>
                                <p className="font-semibold text-sm text-gray-800">{u.username}</p>
                            </div>
                            <Button onClick={() => handleSendRequest(u._id)} size="sm" variant="destructive" className="h-7 text-xs">
                                Add
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* ---------------- MAIN WINDOW ---------------- */}
      <div className={`${showMainPanelMobile ? 'flex' : 'hidden'} md:flex w-full md:w-[70%] lg:w-[75%] bg-white flex-col relative`}>
        
                {/* ----- ANONYMOUS MODE VIEW ----- */}
                {activeTab === 'ANONYMOUS' ? (
                     <div className="h-full w-full flex flex-col bg-slate-50">
                         
                         {/* HEADER */}
                          <div className="h-[70px] bg-white border-b border-gray-50 flex items-center px-4 justify-between shrink-0">
                             <Button variant="ghost" size="icon" onClick={() => setActiveTab('FRIENDS')} className="md:hidden"><ChevronLeft/></Button>
                             <h2 className="font-bold text-lg text-purple-600 flex items-center gap-2"><Ghost size={20}/> Anonymous Chat</h2>
                             {anonStatus === 'MATCHED' && <Button variant="destructive" size="sm" onClick={stopAnonymous}>Disconnect</Button>}
                          </div>
        
                         {/* IDLE */}
                         {anonStatus === 'IDLE' && (
                             <div className="flex-1 flex flex-col items-center justify-center p-8">
                                 <motion.div 
                                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                                    className="h-32 w-32 bg-purple-100 rounded-full flex items-center justify-center mb-6"
                                >
                                     <Ghost size={64} className="text-purple-500" />
                                 </motion.div>
                                 <h2 className="text-2xl font-bold text-gray-800 mb-2">Find a Stranger</h2>
                                 <p className="text-gray-500 mb-8 max-w-sm text-center">Click below to be paired with a random user online.</p>
                                 <Button 
                                    onClick={startAnonymous}
                                    className="px-8 py-6 bg-purple-600 rounded-2xl font-bold text-lg hover:bg-purple-700 shadow-xl shadow-purple-200"
                                 >
                                    Start Searching
                                 </Button>
                             </div>
                         )}
        
                         {/* SEARCHING */}
                         {anonStatus === 'SEARCHING' && (
                             <div className="flex-1 flex flex-col items-center justify-center p-8">
                                 <RefreshCw size={48} className="text-purple-500 animate-spin mb-6" />
                                 <h2 className="text-xl font-bold text-gray-800">Looking for someone...</h2>
                                 <Button variant="ghost" onClick={stopAnonymous} className="mt-8">Cancel</Button>
                             </div>
                         )}
        
                         {/* MATCHED */}
                         {anonStatus === 'MATCHED' && (
                             <div className="flex-1 flex flex-col min-h-0">
                                <ScrollArea className="flex-1 bg-[var(--primary-color)] p-4">
                                  <div className="p-4 space-y-4">
                                    {anonMessages.map((msg, i) => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                            key={i} className={`flex ${msg.senderId === 'ME' ? 'justify-end' : msg.senderId === 'SYSTEM' ? 'justify-center' : 'justify-start'}`}
                                        >
                                            {msg.senderId === 'SYSTEM' ? (
                                                <span className="text-xs bg-gray-200 text-gray-500 px-3 py-1 rounded-full">{msg.content}</span>
                                            ) : (
                                                <div className={`px-4 py-2 rounded-2xl max-w-[80%] shadow-sm ${msg.senderId === 'ME' ? 'bg-purple-600 text-white' : 'bg-white text-gray-800 border-gray-100'}`}>
                                                    {msg.content}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                    <div ref={anonEndRef} />
                                  </div>
                                </ScrollArea>
                                <div className="p-4 bg-white border-t border-gray-50 shrink-0">
                                    <div className="flex gap-2">
                                        <Input 
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && sendAnonymousMessage()}
                                            className="h-12 rounded-xl"
                                            placeholder="Say hello (anonymously)..."
                                        />
                                        <Button onClick={sendAnonymousMessage} className="h-12 w-12 rounded-xl bg-purple-600 hover:bg-purple-700">
                                            <Send size={20}/>
                                        </Button>
                                    </div>
                                </div>
                             </div>
                         )}
                     </div>
        ) : (
            /* ----- FRIENDS CHAT VIEW ----- */
            !selectedChat ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center bg-gray-50/30">
                    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}>
                        <div className="p-4 rounded-full bg-red-50 mb-4 shadow-sm">
                            <MessageSquare size={32} className="text-red-400" />
                        </div>
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-800">Welcome back</h3>
                    <p className="text-gray-500 mt-2 max-w-md px-4">Select a friend to start chatting or try Incognito mode.</p>
                </div>
            ) : (
                <>
                    {/* CHAT HEADER */}
                    <div className="h-[70px] bg-white border-b border-gray-50 flex items-center px-4 md:px-6 justify-between shrink-0 z-10">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedChat(null)} className="md:hidden -ml-2">
                                <ChevronLeft size={24} />
                            </Button>
                            
                            {selectedChat.isGroup ? (
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white">
                                    <Users size={20} className="text-indigo-600"/>
                                </div>
                            ) : (
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={selectedChat.avatar} />
                                    <AvatarFallback>{selectedChat.username?.[0]}</AvatarFallback>
                                </Avatar>
                            )}
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 leading-tight">{selectedChat.isGroup ? selectedChat.groupName : selectedChat.username}</h2>
                                {!selectedChat.isGroup && <span className="flex items-center gap-1.5 mt-0.5 text-xs text-green-500">
                                    <span className="h-2 w-2 rounded-full bg-green-500"></span> Online
                                </span>}
                            </div>
                        </div>
                    </div>

                    {/* MESSAGES AREA */}
                     <ScrollArea className="flex-1 bg-[var(--primary-color)]">
                        <div className="p-4 md:p-6 space-y-4 min-h-0">
                            {messages.map((msg, i) => {
                                const isOwn = msg.senderId === user?._id;
                                return (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        key={msg._id || i} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex flex-col max-w-[80%] md:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                            <span className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${isOwn ? 'bg-[var(--message-outgoing)] text-gray-800 rounded-br-none' : 'bg-[var(--message-incoming)] text-gray-800 rounded-bl-none border border-gray-100'}`}>
                                                {msg.content}
                                            </span>
                                            {msg.createdAt && <span className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(msg.createdAt)}</span>}
                                        </div>
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* INPUT AREA */}
                    <div className="p-4 bg-white border-t border-gray-50">
                        <div className="flex items-center gap-2">
                            <Input
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a message..."
                                className="flex-1 bg-[var(--secondary-color)] border-transparent h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-[var(--animated-dots)]"
                            />
                            <Button 
                                onClick={handleSendMessage}
                                disabled={!message.trim()}
                                className="h-12 w-12 rounded-xl bg-[var(--animated-dots)] hover:bg-[#c96a6a] transition-colors"
                            >
                                <Send size={20} />
                            </Button>
                        </div>
                    </div>
                </>
            )
        )}
      </div>
    </div>
  );
};

export default Chat;
