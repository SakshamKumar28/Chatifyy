import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

const Chat = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        setUser(response.data.user);
        console.log(user);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className='h-screen w-screen flex items-center justify-center bg-[var(--primary-color)]'>
        <p className='text-white text-xl'>Loading...</p>
      </div>
    );
  }

  return (
    <>
        <div className='h-full w-full relative  flex'>
            <div className='h-full w-[3.6%] py-5 bg-red-400 flex flex-col items-center justify-between'>
              <h1 className='text-2xl text-red-600 font-extrabold'>C</h1>
              <div className='h-[6.5%] w-[85%] mb-8 bg-red-700 rounded-full'>
                {user && (
                  <img 
                    src={user.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149288.png'}
                    alt="Avatar"
                    className="h-full w-full rounded-full object-cover"
                  />
                )}
              </div>
            </div>
            <div className='h-full w-[33%] bg-red-500'></div>
            <div className='h-full w-[63.4%] bg-red-700'></div>
        </div>
    </>
  );
};

export default Chat;
