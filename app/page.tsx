// src/app/page.tsx
'use client';
import DualLeaderboard from './components/dashboard-components/DualLeaderboard';
import './globals.css';
import { ArrowRight, Github } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Cloud from './components/dashboard-components/Cloud';
import SunGlareEffect from './components/dashboard-components/SunGlareEffect';
import { handleSignIn } from './lib/utils';
import { useAuthStore } from './store/useAuthStore';

const Dashboard = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data.type === 'AUTH_SUCCESS'
      ) {
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col text-white">
      <SunGlareEffect />
      <Cloud />
      <div className="z-20 h-[80px] shrink-0">
        <Navbar />
      </div>
      <div className="w-11/12 mx-auto grid grid-cols-1 md:grid-cols-[40%_minmax(0,1fr)] gap-8 items-start py-12 md:py-0 flex-grow">
        <div className="z-10 flex flex-col items-center md:items-start justify-center text-left py-0 md:py-12 md:h-[calc(100vh-80px)]">
          <div className="flex flex-col items-center md:items-start gap-2 mb-6">
            <p className="text-xs sm:text-sm text-white font-medium">
              Join Our Founding Team Challenge
            </p>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <span className="text-white font-bold text-lg">Your Startup</span>
              </div>
            </div>
          </div>

          <h1 className="font-extrabold text-5xl tracking-tight sm:text-6xl md:text-5xl text-white">
            Founding Team
          </h1>
          <h1 className="mb-4 md:mb-6 font-extrabold text-4xl sm:text-5xl md:text-6xl tracking-tight text-yellow-300">
            Developer Challenge
          </h1>
          <p className="mb-6 max-w-2xl text-base sm:text-lg md:text-xl text-gray-200 text-center md:text-left px-4 md:px-0">
            Prove your skills in our <strong>Founding Team Developer Challenge</strong>! Compete in two exciting tracks:
            <strong> Full Stack Development</strong> and <strong>AI/ML Development</strong>. 
            Top performers will be invited to join our founding team!
          </p>
          <div className="flex flex-row gap-4 sm:flex-row">
            {!user ? (
              <>
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="flex cursor-pointer transform items-center justify-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium sm:px-8 sm:py-3 sm:font-semibold text-white shadow-lg transition duration-300 ease-in-out hover:scale-105 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-slate-900 sm:gap-3"
                >
                  <Github size={22} />
                  Log in with GitHub
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/register')}
                  className="transform cursor-pointer rounded-lg bg-yellow-400 px-6 py-2 text-sm font-medium sm:px-8 sm:py-3 sm:font-semibold text-gray-900 shadow-lg transition duration-300 ease-in-out hover:scale-105 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-amber-700"
                >
                  Join Challenge
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => router.push(`/profile/${user.github_username}`)}
                className="flex cursor-pointer transform items-center justify-between gap-2 rounded-3xl bg-gray-800 px-2 py-2 text-sm font-medium w-fit sm:font-semibold text-white shadow-lg transition duration-300 ease-in-out hover:scale-105 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-slate-900 sm:gap-3"
              >
                <img
                  src={`https://github.com/${user.github_username}.png`}
                  alt={user.github_username}
                  className="h-8 w-8 rounded-full border border-gray-300 shadow-sm"
                />
                <span className="font-semibold text-base">
                  Track My Progress
                </span>
                <ArrowRight size={24} />
              </button>
            )}
          </div>
        </div>
        <div className="relative z-10 flex w-full flex-1 flex-col items-center py-8 md:py-4 md:h-[calc(100vh-80px)]">
          <div className="w-full h-full">
            <DualLeaderboard user={user ? user : null} />
          </div>
        </div>
      </div>
      <footer className="w-full text-center py-4 mt-8 text-sm text-gray-950 font-medium ">
        <span className="inline-flex items-center gap-2 justify-center">
          <span className="text-blue-400">🚀</span>
          <span>Join Our Founding Team Challenge</span>
        </span>
      </footer>
    </div>
  );
};

export default Dashboard;
