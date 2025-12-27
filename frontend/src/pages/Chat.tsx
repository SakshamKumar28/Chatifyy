import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Search, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';

interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface Message {
  senderId: string;
  recieverId: string;
  content: string;
}

const Chat = () => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [selectedChat, setSelectedChat] = useState<User | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();

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

  /* ---------------- SOCKET SETUP ---------------- */
  useEffect(() => {
    if (!user) return;

    socketRef.current = io(
      import.meta.env.VITE_API_URL || 'http://localhost:3000',
      { withCredentials: true }
    );

    socketRef.current.emit('joinRoom', user._id);

    socketRef.current.on('receiveMessage', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  /* ---------------- SEND MESSAGE ---------------- */
  const handleSendMessage = () => {
    if (!message || !selectedChat || !user) return;

    const messageData: Message = {
      senderId: user._id,
      recieverId: selectedChat._id,
      content: message,
    };

    socketRef.current?.emit('sendMessage', messageData);
    setMessages(prev => [...prev, messageData]);
    setMessage('');
  };

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    navigate('/login');
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
      <div className="h-full w-[3.6%] py-5 bg-[var(--message-incoming)] flex flex-col items-center justify-between relative">
        <h1 className="text-2xl text-red-600 font-extrabold">C</h1>

        <div
          onClick={() => setIsDialogOpen(prev => !prev)}
          className="h-[6.5%] w-[85%] mb-8 bg-red-700 rounded-full cursor-pointer"
        >
          <img
            src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149288.png'}
            className="h-full w-full rounded-full object-cover"
          />
        </div>

        <AnimatePresence>
          {isDialogOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="h-[8vw] w-[25vh] bg-white absolute bottom-10 left-10 shadow-lg rounded-lg flex flex-col items-center justify-evenly z-50 p-4"
            >
              <p className="font-semibold">{user?.username}</p>
              <hr className="w-full border-b" />
              <p className="text-sm text-gray-500">{user?.email}</p>
              <hr className="w-full border-b" />
              <button
                onClick={handleLogout}
                className="px-4 py-2 w-full bg-red-500 text-white rounded-md"
              >
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* USER LIST */}
      <div className="h-full w-[33%] bg-[#f7e9e9] flex flex-col">
        <div className="h-[9vh] bg-[var(--message-outgoing)] flex items-center justify-between px-4 shadow-md">
          <h2 className="text-lg font-bold text-red-600">Chatifyy</h2>
          <div className="flex items-center border-2 rounded-lg border-red-400 overflow-hidden">
            <input className="bg-[#f7e9e9] px-2 py-1 focus:outline-none" placeholder="Search Chat" />
            <Search className="ml-2 text-red-600" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {users.map(u => (
            <div
              key={u._id}
              onClick={() => {
                setSelectedChat(u);
                setMessages([]);
              }}
              className="flex items-center gap-4 p-4 border-b hover:bg-gray-200 cursor-pointer"
            >
              <img
                src={u.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149288.png'}
                className="h-12 w-12 rounded-full object-cover"
              />
              <p className="font-semibold">{u.username}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className="h-full w-[63.4%] bg-[var(--primary-color)] flex flex-col">
        <div className="h-[9vh] bg-[#f7e9e9] flex items-center gap-4 pl-10 shadow-md">
          <div className='h-12 w-12 rounded-full overflow-hidden mr-4'>
            <img src={selectedChat?.avatar || "https://cdn-icons-png.flaticon.com/512/6596/6596121.png"} alt="" />
          </div>
          <h2 className="text-xl font-bold text-red-700">
            {selectedChat?.username || 'Select a chat'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-2 ${msg.senderId === user?._id ? 'text-right' : 'text-left'} `}
            >
              <span className={`inline-block px-4 py-2 rounded-lg max-w-[60%] ${
                msg.senderId === user?._id
                  ? 'bg-[var(--message-outgoing)] text-stone-700'
                  : 'bg-[var(--message-incoming)] text-black'
              }`}>
                {msg.content}
              </span>
            </div>
          ))}
        </div>

        {selectedChat && (
          <div className="h-[8vh] bg-[#f3a3a3] flex items-center px-4">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-[87%] px-4 py-2 focus:outline-none"
            />
            <Send
              onClick={handleSendMessage}
              className="ml-4 text-red-600 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
