import React, { useState } from 'react'
import { toast } from "sonner"
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import api from "../utils/api"

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const arr = Array.from({ length: 30 }, (_, i) => i);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try{
            const response = await api.post('/auth/login', { email, password });
            console.log('Login successful: ', response.data);
            localStorage.setItem('token', response.data.token);
            navigate('/chat');

        }catch(err: any){
            console.error('Login failed: ', err);
            const msg = err.response?.data?.message || 'Login failed';
            setError(msg);
            toast.error(msg);
        }finally{
            setLoading(false);
        }
    }

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
        <div className="z-10 w-[90%] sm:w-[70%] md:w-[50%] lg:w-[35vw] h-auto py-10 bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl flex flex-col items-center justify-center p-6 sm:p-10">
            <h1 className='text-3xl font-bold text-gray-800 mb-2'>Welcome Back</h1>
            <p className="text-gray-500 mb-8 text-sm">Sign in to continue to Chatifyy</p>
            
            <form onSubmit={handleSubmit} className='flex flex-col w-full gap-5'>
                {error && (
                    <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm'>
                        {error}
                    </div>
                )}
                
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

                <div className="flex justify-end">
                    <a href="#" className="text-xs font-semibold text-[var(--message-outgoing)] hover:underline">Forgot Password?</a>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className='w-full bg-[var(--message-outgoing)] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-pink-200 hover:shadow-pink-300 hover:bg-[var(--message-outgoing-hover)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2'
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login'}
                </button>
            </form>
            <p className='mt-8 text-sm text-gray-500'>
                Don't have an account? 
                <a href="/register" className='ml-1 text-[var(--message-outgoing)] font-bold hover:underline'>Register</a>
            </p>
        </div>
    </div>
  )
}

export default Login;
