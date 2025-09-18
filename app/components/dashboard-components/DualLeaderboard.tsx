'use client';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { make_api_call } from '@/app/lib/api';
import { AuthState, type AuthUser } from '@/app/store/useAuthStore';
import { ArrowLeftCircle, ArrowRightCircle, Trophy, Medal, Award } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaSort, FaSortDown, FaSortUp } from 'react-icons/fa';
import { MdCode, MdMonetizationOn, MdScience, MdWeb } from 'react-icons/md';
import { Card, CardDescription, CardHeader } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import ParticipantAvatar from './ParticipantAvatar';

export type TUserData = {
  github_username: string;
  full_name: string | null;
  category: string;
  points: number;
  pr_count: number;
  issues_solved: number;
  rank: number;
};

type LeaderboardData = {
  fullstack: TUserData[];
  aiml: TUserData[];
};

const CategoryLeaderboard = ({ 
  category, 
  data, 
  isLoading, 
  user 
}: { 
  category: 'fullstack' | 'aiml';
  data: TUserData[];
  isLoading: boolean;
  user: AuthUser | null;
}) => {
  const router = useRouter();
  const [sortCriteria, setSortCriteria] = useState<'points' | 'pr_count' | null>('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortedData, setSortedData] = useState<TUserData[]>(data);

  useEffect(() => {
    setSortedData(data);
  }, [data]);

  const sortData = (criteria: 'points' | 'pr_count') => {
    let order = sortOrder;
    if (sortCriteria === criteria) {
      order = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      order = 'desc';
    }
    setSortCriteria(criteria);
    setSortOrder(order);

    const sorted = [...data].sort((a, b) => {
      const aValue = a[criteria];
      const bValue = b[criteria];
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setSortedData(sorted);
  };

  const getSortIcon = (criteria: 'points' | 'pr_count') => {
    if (sortCriteria !== criteria) {
      return <FaSort className="opacity-50" />;
    }
    return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const handleUserClick = (username: string) => {
    if (user?.email) {
      router.push(`/profile/${username}`);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-700 text-xs font-semibold text-white">
            {rank}
          </span>
        );
    }
  };

  const categoryInfo = {
    fullstack: {
      title: 'Full Stack Developers',
      icon: <MdWeb className="h-6 w-6" />,
      color: 'from-blue-500 to-purple-600',
      description: 'Building end-to-end web applications'
    },
    aiml: {
      title: 'AI/ML Developers',
      icon: <MdScience className="h-6 w-6" />,
      color: 'from-green-500 to-teal-600',
      description: 'Creating intelligent systems and models'
    }
  };

  const info = categoryInfo[category];

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-white/60"></div>
        <p className="mt-4 text-white/60">Loading {info.title}...</p>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="flex items-center justify-center px-4 py-8">
        <div className="w-full rounded-2xl bg-white/40 p-8 text-center backdrop-blur-sm">
          <div className={`mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r ${info.color} p-4 text-white`}>
            {info.icon}
          </div>
          <p className="text-xl font-medium text-gray-800">
            Be the first {category === 'fullstack' ? 'Full Stack' : 'AI/ML'} developer on the leaderboard!
          </p>
          <p className="mt-2 text-gray-600">
            Start solving issues labeled with {category === 'fullstack' ? '"fullstack"' : '"ai", "ml", or "aiml"'} to earn points.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Header */}
      <div className={`rounded-xl bg-gradient-to-r ${info.color} p-4 text-white`}>
        <div className="flex items-center gap-3">
          {info.icon}
          <div>
            <h3 className="text-lg font-bold">{info.title}</h3>
            <p className="text-sm opacity-90">{info.description}</p>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center rounded-xl bg-white/20 px-3 py-2 font-medium text-gray-900 shadow-sm">
        <div className="flex-grow font-medium pl-2">Developer</div>
        <div className="w-[25%] text-center hidden md:flex justify-center">
          <button
            type="button"
            onClick={() => sortData('pr_count')}
            className="flex items-center cursor-pointer justify-center gap-1 rounded-3xl bg-blue-500/50 px-3 py-1 font-medium text-gray-900 shadow-sm transition-all duration-200 hover:bg-blue-500/70"
          >
            <MdCode className="mr-1" /> PRs {getSortIcon('pr_count')}
          </button>
        </div>
        <div className="w-auto md:w-[25%] flex justify-end pr-1">
          <button
            type="button"
            onClick={() => sortData('points')}
            className="flex items-center cursor-pointer gap-1 rounded-3xl bg-amber-500/50 px-3 py-1 font-medium text-gray-900 shadow-sm transition-all duration-200 hover:bg-amber-500/70"
          >
            <MdMonetizationOn className="mr-1" /> Points {getSortIcon('points')}
          </button>
        </div>
      </div>

      {/* Leaderboard List */}
      <ScrollArea className="max-h-96 overflow-y-auto">
        {sortedData.map((userData, index) => (
          <button
            key={userData.github_username}
            type="button"
            onClick={() => handleUserClick(userData.github_username)}
            className={
              user?.email
                ? `my-1 flex items-center rounded-xl bg-white/10 px-3 py-2 text-gray-800 backdrop-blur-md cursor-pointer transition-all duration-200 hover:bg-white/20 hover:shadow-md hover:scale-[0.98] w-full text-left`
                : `my-1 flex items-center rounded-xl bg-white/10 px-3 py-2 text-gray-800 backdrop-blur-md w-full text-left pointer-events-none`
            }
          >
            <div className="flex flex-grow items-center gap-3">
              <div className="relative">
                <ParticipantAvatar username={userData.github_username} />
                <div className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center">
                  {getRankIcon(userData.rank)}
                </div>
              </div>
              <div>
                <div className="font-semibold">
                  {userData.full_name || userData.github_username}
                </div>
                <div className="text-gray-600 text-sm">@{userData.github_username}</div>
                <div className="text-xs text-gray-500">{userData.issues_solved} issues solved</div>
              </div>
            </div>
            <div className="w-[25%] text-center hidden md:block font-medium">
              {userData.pr_count}
            </div>
            <div className="w-auto text-right md:w-[25%] pr-1 font-bold text-lg">
              {userData.points}
            </div>
          </button>
        ))}
      </ScrollArea>
    </div>
  );
};

const DualLeaderboard = ({ user }: { user: AuthUser | null }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({
    fullstack: [],
    aiml: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fullstack' | 'aiml'>('fullstack');

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        setIsLoading(true);
        const result = await make_api_call<{
          message: string;
          leaderboards: LeaderboardData;
        }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/leaderboard`,
          method: 'GET',
          headers: user?.access_token ? {
            Authorization: `Bearer ${user.access_token}`,
          } : {},
        });

        if (result.data?.leaderboards) {
          setLeaderboardData(result.data.leaderboards);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboards();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchLeaderboards, 30000);
    return () => clearInterval(interval);
  }, [user?.access_token]);

  const getTotalParticipants = () => {
    return leaderboardData.fullstack.length + leaderboardData.aiml.length;
  };

  return (
    <Card className="z-10 flex w-full max-h-full flex-col rounded-3xl border border-white/20 bg-white/35 p-4 backdrop-blur-md">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-4xl text-gray-800">Challenge Leaderboard</h2>
            <CardDescription className="text-gray-600">
              Compete in Full Stack or AI/ML development tracks
            </CardDescription>
            <p className="text-sm text-gray-500 mt-1">
              {getTotalParticipants()} total participants • Updates every 30 seconds
            </p>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'fullstack' | 'aiml')} className="flex-1">
        <TabsList className="grid w-full grid-cols-2 bg-white/20 p-1 rounded-3xl backdrop-blur-sm mb-4">
          <TabsTrigger
            value="fullstack"
            className="py-2.5 text-sm font-bold data-[state=inactive]:text-gray-800 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-3xl transition-all cursor-pointer"
          >
            <MdWeb className="mr-2 h-4 w-4" />
            Full Stack ({leaderboardData.fullstack.length})
          </TabsTrigger>
          <TabsTrigger
            value="aiml"
            className="py-2.5 text-sm font-bold data-[state=inactive]:text-gray-800 data-[state=active]:bg-white data-[state=active]:shadow-md rounded-3xl transition-all cursor-pointer"
          >
            <MdScience className="mr-2 h-4 w-4" />
            AI/ML ({leaderboardData.aiml.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fullstack" className="flex-grow">
          <CategoryLeaderboard
            category="fullstack"
            data={leaderboardData.fullstack}
            isLoading={isLoading}
            user={user}
          />
        </TabsContent>

        <TabsContent value="aiml" className="flex-grow">
          <CategoryLeaderboard
            category="aiml"
            data={leaderboardData.aiml}
            isLoading={isLoading}
            user={user}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default DualLeaderboard;