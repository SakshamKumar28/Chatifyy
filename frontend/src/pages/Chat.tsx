import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Search, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface Message {
  _id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt?: string;
}

const Chat = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [selectedChat, setSelectedChat] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedChatRef = useRef<User | null>(null);
  
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  /* ---------------- SOCKET SETUP ---------------- */
  useEffect(() => {
    if (!user) return;

    // Use the origin (http://localhost:3000) instead of full API URL
    const socketUrl = import.meta.env.VITE_API_URL 
      ? new URL(import.meta.env.VITE_API_URL).origin 
      : 'http://localhost:3000';

    // 1. Initialize socket exactly once per user session
    socketRef.current = io(socketUrl, { 
        withCredentials: true,
        transports: ['websocket', 'polling'] // Enforce robust transport
    });

    socketRef.current.on('connect', () => {
        console.log("🟢 Socket connected:", socketRef.current?.id);
        setIsConnected(true);
        socketRef.current?.emit('joinRoom', user._id);
    });

    socketRef.current.on('connect_error', (err) => {
        console.error("🔴 Socket connection error:", err);
        setIsConnected(false);
    });

    socketRef.current.on('disconnect', (reason) => {
        console.warn("⚠️ Socket disconnected:", reason);
        setIsConnected(false);
    });

    // 2. Setup message listener that uses the Ref to check active chat
    socketRef.current.on('receiveMessage', (msg: Message) => {
      console.log("📩 Socket received:", msg);
      // Check against the REF, which is always current
      const activeChat = selectedChatRef.current;
      const isFromActiveChat = activeChat && (msg.senderId === activeChat._id || msg.senderId === user._id);
      
      if (isFromActiveChat) {
         setMessages(prev => {
            // Prevent duplicates (REST can race with Socket)
            if (prev.some(m => m._id === msg._id)) return prev;
            return [...prev, msg];
         });
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]); // REMOVED selectedChat from dependencies! Socket stays alive now.

  /* ---------------- FETCH PROFILE ---------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setUser(res.data.user);
      } catch {
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  /* ---------------- FETCH USERS ---------------- */
  useEffect(() => {
    if (!user) return;

    const fetchUsers = async () => {
      const res = await api.get('/auth/users');
      setUsers(res.data.data.filter((u: User) => u._id !== user._id));
    };

    fetchUsers();
  }, [user]);

  /* ---------------- FETCH CHAT HISTORY ---------------- */
  useEffect(() => {
    if (!selectedChat || !user) return;

    const fetchChatHistory = async () => {
      try {
        console.log("🔍 Fetching history for:", selectedChat._id);
        const res = await api.post('/chats', {
          userId2: selectedChat._id
        });
        
        console.log("📄 History received:", res.data.data.messages.length);

        const history = res.data.data.messages.map((m: any) => ({
          _id: m._id,
          senderId: m.sender?._id || 'unknown',
          receiverId: m.receiver?._id || 'unknown',
          content: m.content || '',
          createdAt: m.createdAt
        }));
        
        setMessages(history);
      } catch (err) {
        console.error("Failed to fetch chat history", err);
      }
    };

    fetchChatHistory();
  }, [selectedChat, user]);


  /* ---------------- SEND MESSAGE ---------------- */
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat || !user) return;

    try {
        console.log("📤 Sending message via REST...");
        const res = await api.post('/messages', {
            senderId: user._id,
            receiverId: selectedChat._id,
            content: message
        });

        if (res.status === 201) {
            const newMessage = res.data.data;
            console.log("✅ Message saved:", newMessage._id);

            // Append to local state (check for dups mostly not needed as socket handles receive, but good for instant feedback)
            setMessages(prev => {
                if (prev.some(m => m._id === newMessage._id)) return prev;
                return [...prev, newMessage];
            });
            setMessage('');
        }
        
    } catch (err: any) {
        console.error("❌ Failed to send message:", err);
        alert(`Failed to send: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--primary-color)]">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative flex">

      {/* SIDEBAR */}
      <div className="h-full w-[3.6%] py-5 bg-[var(--message-incoming)] flex flex-col items-center justify-between relative shadow-sm z-10">
        <h1 className="text-2xl text-red-600 font-extrabold cursor-pointer">C</h1>

        <div
          onClick={() => setIsDialogOpen(prev => !prev)}
          className="h-10 w-10 mb-8 bg-red-700 rounded-full cursor-pointer overflow-hidden border-2 border-transparent hover:border-red-400 transition-all"
        >
          <img
            src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149288.png'}
            className="h-full w-full object-cover"
            alt="Profile"
          />
        </div>

        <AnimatePresence>
          {isDialogOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-5 left-16 bg-white shadow-xl rounded-xl p-4 w-64 border border-gray-100 z-50 origin-bottom-left"
            >
              <div className="flex items-center gap-3 mb-4">
                 <img
                    src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149288.png'}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-gray-800">{user?.username}</p>
                    <p className="text-xs text-gray-500 truncate w-32">{user?.email}</p>
                  </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* USER LIST */}
      <div className="h-full w-[30%] bg-[#fcfcfc] flex flex-col border-r border-gray-100">
        <div className="h-[80px] flex items-center justify-between px-6 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
            <span 
              className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ring-2 ring-white shadow-sm transition-colors duration-300`}
              title={isConnected ? "Connected to server" : "Disconnected"}
            ></span>
          </div>
          <div className="bg-gray-100 rounded-full p-2 text-gray-400">
             <MessageSquare size={18} />
          </div>
        </div>

        <div className="px-4 py-3">
            <div className="flex items-center bg-gray-100/50 rounded-xl px-4 py-2.5 focus-within:bg-gray-100 focus-within:ring-2 ring-red-100 transition-all">
                <Search className="text-gray-400" size={18} />
                <input 
                    className="bg-transparent px-3 flex-1 focus:outline-none text-sm text-gray-700 placeholder:text-gray-400" 
                    placeholder="Search conversations..." 
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {users.map(u => (
            <div
              key={u._id}
              onClick={() => {
                setSelectedChat(u);
                setMessages([]);
                // Optional: Join a specific room if logic changes, currently joining user ID
              }}
              className={`flex items-center gap-4 p-3 mb-1 rounded-xl cursor-pointer transition-all ${
                selectedChat?._id === u._id 
                    ? 'bg-red-50 border-l-4 border-red-500 pl-2' 
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
              }`}
            >
              <div className="relative">
                 <img
                    src={u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149288.png'}
                    className="h-10 w-10 rounded-full object-cover shadow-sm"
                    alt={u.username}
                />
                <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></span>
              </div>
              <div>
                  <p className={`font-semibold text-sm ${selectedChat?._id === u._id ? 'text-red-900' : 'text-gray-700'}`}>{u.username}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Click to chat</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className="h-full flex-1 bg-white flex flex-col relative">
        {!selectedChat ? (
            /* EMPTY STATE */
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-gray-50/30">
                <div className="p-4 rounded-full bg-red-50 mb-4 animate-bounce">
                    <MessageSquare size={32} className="text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Welcome to Chatifyy</h3>
                <p className="text-gray-500 mt-2 max-w-md px-4">Select a conversation from the sidebar to start messaging instantly.</p>
            </div>
        ) : (
            /* SELECTED CHAT VIEW */
            <>
                <div className="h-[80px] bg-white border-b border-gray-50 flex items-center px-6 justify-between shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className='h-10 w-10 rounded-full overflow-hidden shadow-sm'>
                        <img src={selectedChat?.avatar || "https://cdn-icons-png.flaticon.com/512/6596/6596121.png"} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 leading-tight">
                            {selectedChat?.username}
                        </h2>
                        <span className="flex items-center gap-1.5 mt-0.5">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="text-xs text-gray-400">Online</span>
                        </span>
                    </div>
                </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
                {messages.map((msg, i) => {
                    const isOwn = msg.senderId === user?._id;
                    return (
                        <div
                            key={i}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                <span 
                                    className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm ${
                                    isOwn
                                        ? 'bg-red-500 text-white rounded-br-none'
                                        : 'bg-white text-gray-700 rounded-bl-none border border-gray-100'
                                    }`}
                                >
                                    {msg.content}
                                </span>
                                {msg.createdAt && (
                                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                                        {formatTime(msg.createdAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white shrink-0 border-t border-gray-50">
                    <div className="flex items-center bg-gray-50 rounded-xl px-4 py-2 border border-transparent focus-within:border-red-200 focus-within:bg-white focus-within:ring-2 ring-red-50 transition-all">
                        <input
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent py-2 px-2 focus:outline-none text-gray-700 placeholder:text-gray-400"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={!message.trim()}
                            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default Chat;
