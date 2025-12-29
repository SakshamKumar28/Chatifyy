import api from "../utils/api"
import React, { useState } from 'react'
import { motion } from 'motion/react'
import { toast } from "sonner"
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Check, X, Loader2 } from 'lucide-react';

const Register = () => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [gender, setGender] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Suggestion State
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

    const navigate = useNavigate();

    const checkUsername = async (u: string) => {
        if (!u || u.length < 3) return;
        setIsCheckingUsername(true);
        try {
            const res = await api.post('/auth/check-username', { username: u });
            if (res.data.available) {
                setUsernameAvailable(true);
                setSuggestions([]);
            } else {
                setUsernameAvailable(false);
                setSuggestions(res.data.suggestions || []);
            }
        } catch (err) {
            console.error("Error checking username", err);
        } finally {
            setIsCheckingUsername(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/register', { fullName, username, email, password, gender });
            console.log('Registration successful:', response.data);
            localStorage.setItem('token', response.data.token);
            navigate('/chat');
        } catch (error: any) {
            console.error("Registration failed:", error);
            const msg = error.response?.data?.message || 'Registration failed';
            setError(msg);
            toast.error(msg);
        }finally{
            setLoading(false);
        }
    };

    const arr = Array.from({ length: 30 }, (_, i) => i);

  return (
    <div className='h-full w-full flex justify-center items-center bg-[var(--primary-color)] relative overflow-hidden'>
        {arr.map((i)=>{
            return(
                <motion.div
                    key={i}
                    className="fixed top-0 left-0 w-[0.7rem] h-[0.7rem] bg-[var(--animated-dots)] opacity-20 rounded-full pointer-events-none"
                    initial={{
                        x: Math.random() * window.innerWidth,
                        y: -10
                    }}
                    animate={{
                        y: window.innerHeight + 20,
                        x: Math.random() * window.innerWidth + Math.sin(i) * 30
                    }}
                    transition={{
                        duration: 5 + Math.random() * 5,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 5
                    }}
                />
            )
        })}
        <div className="z-10 w-[90%] sm:w-[70%] md:w-[50%] lg:w-[35vw] h-auto py-8 bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl flex flex-col items-center justify-center p-6 sm:p-8">
            <h1 className='text-3xl font-bold text-gray-800 mb-2'>Create Account</h1>
            <p className="text-gray-500 mb-6 text-sm">Join Chatifyy and connect with friends</p>
            
            <form onSubmit={handleSubmit} className='flex flex-col w-full gap-4'>
                {error && (
                    <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2'>
                        <X size={16} />
                        {error}
                    </div>
                )}
                
                {/* Full Name */}
                <div className="relative">
                    <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                        onChange={(e)=>{setFullName(e.target.value)}} 
                        type="text" 
                        placeholder='Full Name' 
                        value={fullName}
                        disabled={loading}
                        className='w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--message-outgoing)] focus:border-transparent transition-all placeholder-gray-400'
                    />
                </div>

                {/* Username */}
                <div className="flex flex-col gap-1">
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input 
                            onChange={(e)=>{
                                setUsername(e.target.value);
                                setUsernameAvailable(null);
                                setSuggestions([]);
                            }} 
                            onBlur={(e) => checkUsername(e.target.value)}
                            type="text" 
                            placeholder='Username' 
                            value={username}
                            disabled={loading}
                            className={`w-full pl-10 pr-4 py-3 text-sm rounded-xl border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--message-outgoing)] focus:border-transparent transition-all placeholder-gray-400 ${usernameAvailable === false ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                        />
                        {isCheckingUsername && <Loader2 className="absolute right-3 top-3.5 text-gray-400 animate-spin" size={18} />}
                        {usernameAvailable === true && !isCheckingUsername && <Check className="absolute right-3 top-3.5 text-green-500" size={18} />}
                        {usernameAvailable === false && !isCheckingUsername && <X className="absolute right-3 top-3.5 text-red-500" size={18} />}
                    </div>

                    {usernameAvailable === false && suggestions.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <span className="text-xs text-red-500 font-medium ml-1">Username taken. Try these:</span>
                            <div className="flex gap-2 mt-1.5 flex-wrap">
                                {suggestions.map(s => (
                                    <button
                                        type="button" 
                                        key={s} 
                                        onClick={() => {
                                            setUsername(s);
                                            setUsernameAvailable(true);
                                            setSuggestions([]);
                                        }}
                                        className="text-xs bg-gray-100 hover:bg-[var(--message-incoming)] text-gray-700 hover:text-[var(--primary)] border border-gray-200 rounded-full px-3 py-1.5 transition-colors cursor-pointer"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Email */}
                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                        onChange={(e)=>{setEmail(e.target.value)}} 
                        type="email" 
                        placeholder='Email Address' 
                        value={email}
                        disabled={loading}
                        className='w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--message-outgoing)] focus:border-transparent transition-all placeholder-gray-400'
                    />
                </div>

                {/* Gender Selection */}
                <div className="flex gap-3">
                    {['male', 'female'].map((g) => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                gender === g 
                                ? 'bg-[var(--message-outgoing)] text-white border-[var(--message-outgoing)] shadow-sm' 
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {g.charAt(0).toUpperCase() + g.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Password */}
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                        onChange={(e)=>{setPassword(e.target.value)}} 
                        type="password" 
                        placeholder='Password' 
                        value={password}
                        disabled={loading}
                        className='w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--message-outgoing)] focus:border-transparent transition-all placeholder-gray-400'
                    />
                </div>

                {/* Confirm Password */}
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                        onChange={(e)=>{setConfirmPassword(e.target.value)}} 
                        type="password" 
                        placeholder='Confirm Password' 
                        value={confirmPassword}
                        disabled={loading}
                        className='w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--message-outgoing)] focus:border-transparent transition-all placeholder-gray-400'
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className='mt-2 w-full bg-[var(--message-outgoing)] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-pink-200 hover:shadow-pink-300 hover:bg-[var(--message-outgoing-hover)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2'
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                </button>
            </form>
            <p className='mt-6 text-sm text-gray-500'>
                Already have an account? 
                <a href="/login" className='ml-1 text-[var(--message-outgoing)] font-bold hover:underline'>Login</a>
            </p>
        </div>
    </div>
  )
}

export default Register
