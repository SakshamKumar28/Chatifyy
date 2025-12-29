import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Shield, Ghost, Zap } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--primary-color)] font-sans text-gray-900 overflow-x-hidden selection:bg-[var(--animated-dots)] selection:text-white">
      
      {/* --- NAVBAR --- */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white/80 backdrop-blur-md border border-white/50 shadow-sm rounded-full px-6 py-3 flex items-center justify-between w-[90%] max-w-4xl"
      >
         <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-800">
             <div className="h-8 w-8 bg-[var(--animated-dots)] rounded-full flex items-center justify-center text-white">
                 <MessageSquare size={18} fill="currentColor" />
             </div>
             Chatifyy
         </div>
         <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
             <a href="#features" className="hover:text-[var(--animated-dots)] transition-colors">Features</a>
             <a href="#about" className="hover:text-[var(--animated-dots)] transition-colors">About</a>
             <a href="#" className="hover:text-[var(--animated-dots)] transition-colors">Reviews</a>
         </div>
         <Button onClick={() => navigate('/login')} className="rounded-full bg-black text-white hover:bg-gray-800 h-9 px-6 text-xs font-bold">
             Get Started
         </Button>
      </motion.nav>

      {/* --- HERO SECTION --- */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 flex flex-col items-center text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto z-10"
          >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-100 shadow-sm text-xs font-semibold text-[var(--animated-dots)] mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  v2.0 is now live
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1] mb-6">
                  Connect Freely. <br/> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--animated-dots)] to-purple-600">Chat Instantly.</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
                  Experience seamless, secure, and optional anonymous messaging. Join thousands of users connecting every day on Chatifyy.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button onClick={() => navigate('/signup')} className="h-12 px-8 rounded-full text-base bg-[var(--animated-dots)] hover:bg-[#c96a6a] shadow-lg shadow-red-200">
                      Start Chatting Now
                  </Button>
                  <Button variant="outline" className="h-12 px-8 rounded-full text-base bg-white hover:bg-gray-50 border-gray-200">
                      View Demo
                  </Button>
              </div>
          </motion.div>

          {/* BACKGROUND DECORATION */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
              <div className="absolute top-20 left-[10%] w-64 h-64 bg-[var(--message-incoming)] rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
              <div className="absolute top-20 right-[10%] w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-32 left-[40%] w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
          </div>

      </header>

      {/* --- HERO IMAGE CONTAINER (Curve) --- */}
      <section className="relative w-full max-w-6xl mx-auto px-4 -mt-12 md:-mt-20 mb-32 z-20">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-[40px] md:rounded-[60px] overflow-hidden shadow-2xl border-[8px] border-white bg-white/50 backdrop-blur-sm"
          >
             {/* Replace this with a real screenshot or generated image later */}
             <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 relative flex items-center justify-center overflow-hidden group hover:cursor-none">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-90 transition-transform duration-700 group-hover:scale-105"></div>
                 
                 {/* Floating Badges */}
                 <motion.div 
                    animate={{ y: [0, -10, 0] }} 
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="absolute top-10 left-10 md:left-20 bg-white/90 backdrop-blur rounded-2xl p-4 shadow-xl border border-white/20 hidden md:block"
                 >
                     <div className="flex items-center gap-3">
                         <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600"><CheckIcon/></div>
                         <div>
                             <p className="font-bold text-sm">Message Sent</p>
                             <p className="text-xs text-gray-500">Just now</p>
                         </div>
                     </div>
                 </motion.div>

                  <motion.div 
                    animate={{ y: [0, 10, 0] }} 
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-10 right-10 md:right-20 bg-white/90 backdrop-blur rounded-2xl p-4 shadow-xl border border-white/20 hidden md:block"
                 >
                     <div className="flex items-center gap-3">
                         <div className="flex -space-x-3">
                             <div className="h-8 w-8 rounded-full bg-red-400 border-2 border-white"></div>
                             <div className="h-8 w-8 rounded-full bg-purple-400 border-2 border-white"></div>
                             <div className="h-8 w-8 rounded-full bg-blue-400 border-2 border-white"></div>
                         </div>
                         <p className="font-bold text-sm text-gray-700">500+ Online</p>
                     </div>
                 </motion.div>

                 {/* Play Button Overlay */}
                 <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-2xl relative z-10 cursor-pointer hover:scale-110 transition-transform">
                     <div className="h-0 w-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-[var(--animated-dots)] border-b-[10px] border-b-transparent ml-1"></div>
                 </div>
             </div>
          </motion.div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-12 bg-black text-white rounded-[40px] mx-4 md:mx-10 mb-20 relative overflow-hidden">
           <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
               <div>
                   <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">200k+</h3>
                   <p className="text-gray-400 mt-2 text-sm font-medium">Active Users</p>
               </div>
               <div>
                   <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">10+</h3>
                   <p className="text-gray-400 mt-2 text-sm font-medium">Years Experience</p>
               </div>
               <div>
                   <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">800+</h3>
                   <p className="text-gray-400 mt-2 text-sm font-medium">Hours of Calls</p>
               </div>
               <div>
                   <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">150M+</h3>
                   <p className="text-gray-400 mt-2 text-sm font-medium">Messages Sent</p>
               </div>
           </div>
           {/* Decorative Grid */}
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-20 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-16">
              <span className="text-[var(--animated-dots)] font-bold tracking-widest text-xs uppercase mb-2 block">Why Choose Us</span>
              <h2 className="text-4xl font-bold text-gray-900">Turning Chats Into <br/> Masterpieces</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard 
                icon={<Shield className="text-white" />}
                title="Secure Messaging"
                desc="End-to-end encryption ensures your conversations stay private and secure."
                color="bg-black"
                textColor="text-white"
              />
               <FeatureCard 
                icon={<Ghost className="text-black" />}
                title="Anonymous Mode"
                desc="Chat freely with strangers without revealing your identity until you're ready."
                color="bg-[#F3EFEF]"
                textColor="text-gray-900"
              />
               <FeatureCard 
                icon={<Zap className="text-white" />}
                title="Real-time Sync"
                desc="Instant delivery across all your devices with WebSockets technology."
                color="bg-[var(--animated-dots)]"
                textColor="text-white"
              />
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-50 py-12 pb-24 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2 font-bold text-xl text-gray-800">
                    <div className="h-8 w-8 bg-[var(--animated-dots)] rounded-full flex items-center justify-center text-white">
                        <MessageSquare size={18} fill="currentColor" />
                    </div>
                    Chatifyy
              </div>
              <div className="flex gap-8 text-sm text-gray-500">
                  <a href="#">Privacy</a>
                  <a href="#">Terms</a>
                  <a href="#">Support</a>
              </div>
              <p className="text-gray-400 text-sm">© 2024 Chatifyy Inc.</p>
          </div>
      </footer>

    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color, textColor }: any) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className={`p-8 rounded-[30px] ${color} ${textColor} flex flex-col justify-between h-64 shadow-xl`}
    >
        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
            {icon}
        </div>
        <div>
            <h3 className="text-2xl font-bold mb-3">{title}</h3>
            <p className="text-sm opacity-80 leading-relaxed">{desc}</p>
        </div>
    </motion.div>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
)

export default Landing;
