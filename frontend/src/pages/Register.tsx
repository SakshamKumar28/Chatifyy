import api from "../utils/api"
import React, { useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [gender, setGender] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
            const response = await api.post('/auth/register', { username, email, password, gender });
            console.log('Registration successful:', response.data);
            localStorage.setItem('token', response.data.token);
            navigate('/chat');
        } catch (error: any) {
            console.error("Registration failed:", error);
            setError(error.response?.data?.message || 'Registration failed');
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
        <div className="z-10 h-[82vh] w-[35vw] bg-[var(--secondary-color)] shadow-xl rounded-2xl flex flex-col items-center justify-evenly">
            <h1 className='text-3xl font-bold text-[var(--message-outgoing)]'>Welcome to Chatifyy</h1>
            <form onSubmit={handleSubmit} className='flex flex-col w-3/4 gap-5'>
                {error && (
                    <div className='px-[2rem] py-[0.5rem] bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg text-sm'>
                        {error}
                    </div>
                )}
                <input 
                    onChange={(e)=>{setUsername(e.target.value)}} 
                    type="text" 
                    placeholder='Username' 
                    value={username}
                    disabled={loading}
                    className='px-4 py-3 text-[0.95rem] rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--message-outgoing)] placeholder-gray-400 disabled:bg-gray-100'
                />
                <input 
                    onChange={(e)=>{setEmail(e.target.value)}} 
                    type="email" 
                    placeholder='Email' 
                    value={email}
                    disabled={loading}
                    className='px-4 py-3 text-[0.95rem] rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--message-outgoing)] placeholder-gray-400 disabled:bg-gray-100'
                />
                <div className="flex items-center gap-2">
                    <input type="radio" id="male" name="gender" value="male" onChange={(e)=>{setGender(e.target.value)}} />
                    <label htmlFor="male">Male</label>
                    <input type="radio" id="female" name="gender" value="female" onChange={(e)=>{setGender(e.target.value)}} />
                    <label htmlFor="female">Female</label>
                </div>
                <input 
                    onChange={(e)=>{setPassword(e.target.value)}} 
                    type="password" 
                    placeholder='Password' 
                    value={password}
                    disabled={loading}
                    className='px-4 py-3 text-[0.95rem] rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--message-outgoing)] placeholder-gray-400 disabled:bg-gray-100'
                />
                <input 
                    onChange={(e)=>{setConfirmPassword(e.target.value)}} 
                    type="password" 
                    placeholder='Confirm Password' 
                    value={confirmPassword}
                    disabled={loading}
                    className='px-4 py-3 text-[0.95rem] rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--message-outgoing)] placeholder-gray-400 disabled:bg-gray-100'
                />
                <button 
                    type="submit" 
                    disabled={loading}
                    className='bg-[var(--message-outgoing)] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[var(--message-outgoing-hover)] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
            <p className='text-sm text-gray-500'>Already have an account? <a href="/login" className='text-[var(--message-outgoing)] font-semibold hover:underline'>Login</a></p>
        </div>
    </div>
  )
}

export default Register
