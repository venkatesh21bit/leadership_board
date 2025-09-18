import type React from 'react';

import { Activity, Bug, Clock, Sparkles, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

type LogType = 'top3' | 'bounty' | 'issue';

interface LogEntry {
  id: string | number;
  type: LogType;
  user: string;
  timestamp: string;
  description: string;
  avatar?: string;
}

interface ApiLog {
  time: string;
  github_username: string;
  message: string;
  event_type: string;
}

interface ApiResponse {
  updates: ApiLog[];
}

const typeMeta: Record<
  LogType,
  {
    Icon: React.FC<{ className?: string }>;
    label: string;
    iconColor: string;
    dotColor: string;
    pulseColor: string;
  }
> = {
  top3: {
    Icon: Trophy,
    label: 'Top 3',
    iconColor: 'text-amber-500',
    dotColor: 'bg-amber-500',
    pulseColor: 'amber',
  },
  bounty: {
    Icon: Sparkles,
    label: 'Bounty',
    iconColor: 'text-purple-500',
    dotColor: 'bg-purple-500',
    pulseColor: 'purple',
  },
  issue: {
    Icon: Bug,
    label: 'Issue',
    iconColor: 'text-emerald-500',
    dotColor: 'bg-emerald-500',
    pulseColor: 'emerald',
  },
};

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const getTimeAgo = (isoDate: string) => {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return `${diffSecs}s ago`;
};

const validLogType = (type: string): LogType =>
  type in typeMeta ? (type as LogType) : 'issue';

export default function Logtable() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('all');
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [newActivity, setNewActivity] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [fetchedLogs, setFetchedLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Setup clock
  useEffect(() => {
    setHasMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Trigger new activity visual every 15s
  useEffect(() => {
    const activityTimer = setInterval(() => {
      setNewActivity(true);
      setTimeout(() => setNewActivity(false), 2000);
    }, 15000);
    return () => clearInterval(activityTimer);
  }, []);

  // Fetch initial latest logs once
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/updates/latest`,
        );
        const data: ApiResponse = await res.json();

        if (res.ok) {
          const transformed = data.updates.slice(0, 5).map((log) => ({
            id: log.time,
            user: log.github_username,
            description: log.message,
            type: validLogType(log.event_type.toLowerCase().replace(/-/g, '')),
            timestamp: new Date(log.time).toISOString(),
          }));

          setFetchedLogs(transformed);
          setFilteredLogs(transformed);
          console.log('Initial logs:', transformed);
        } else {
          setError('Failed to fetch logs');
        }
      } catch (error) {
        setError('Network error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Set up SSE listener only once, but respond to latest activeTab
  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/updates/live`,
    );

    eventSource.onmessage = (event) => {
      try {
        const raw = event.data.trim();

        // Matches: "username", "message", "eventType", "timestamp"
        const match = raw.match(
          /^"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"$/,
        );

        if (!match || match.length !== 5) {
          throw new Error('Malformed SSE data format');
        }

        const [, username, message, eventType, timeStr] = match;

        const timestampNum = Number(timeStr);
        if (Number.isNaN(timestampNum)) {
          throw new Error(`Invalid timestamp: ${timeStr}`);
        }

        const newEntry: LogEntry = {
          id: timestampNum,
          user: username,
          description: message,
          type: validLogType(eventType.toLowerCase().replace(/-/g, '')),
          timestamp: new Date(timestampNum).toISOString(),
        };

        setFetchedLogs((prev) => [newEntry, ...prev.slice(0, 19)]);

        setFilteredLogs((prev) => {
          if (activeTab === 'all' || newEntry.type === activeTab) {
            return [newEntry, ...prev.slice(0, 19)];
          }
          return prev;
        });
      } catch (err) {
        console.error('Failed to parse SSE data:', event.data, err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      setError('Disconnected from live updates.');
    };

    return () => {
      eventSource.close();
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredLogs(fetchedLogs);
    } else {
      setFilteredLogs(fetchedLogs.filter((log) => log.type === activeTab));
    }
  }, [activeTab, fetchedLogs]);

  if (isLoading) {
    return <div className="p-4 text-gray-800">Loading logs...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <TooltipProvider>
      <div className="flex h-[500px] w-full sm:h-full">
        <Card className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/30 shadow-lg backdrop-blur-md">
          <CardHeader className="shrink-0 bg-white/10 p-4 pb-2 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`rounded-full bg-white/20 p-2 backdrop-blur-md ${
                    newActivity ? 'animate-pulse' : ''
                  }`}
                >
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex flex-col items-start sm:flex-row sm:items-center sm:gap-2">
                  <CardTitle className="font-bold text-gray-800 text-xl">
                    Live Activity
                  </CardTitle>
                  {newActivity && (
                    <Badge
                      variant="outline"
                      className="animate-pulse bg-red-500/20 text-red-600 text-xs mt-1 sm:mt-0 sm:text-sm"
                    >
                      LIVE
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 bg-white/30 backdrop-blur-md"
                >
                  <Clock className="h-3 w-3" />
                  {hasMounted && currentTime ? (
                    <span className="text-xs">
                      {currentTime.toLocaleTimeString()}
                    </span>
                  ) : (
                    <span className="text-xs">--:--:--</span>
                  )}
                </Badge>
              </div>
            </div>

            <Tabs
              defaultValue="all"
              className="mt-2 rounded-3xl"
              onValueChange={setActiveTab}
            >
              <TabsList className="rounded-3xl bg-white/20 backdrop-blur-md">
                <TabsTrigger
                  value="all"
                  className="rounded-3xl text-xs cursor-pointer"
                  aria-label="Show all activity logs"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="top3"
                  className="rounded-3xl text-xs cursor-pointer"
                  aria-label="Show top 3 activity logs"
                >
                  Top 3
                </TabsTrigger>
                <TabsTrigger
                  value="bounty"
                  className="rounded-3xl text-xs cursor-pointer"
                  aria-label="Show bounty activity logs"
                >
                  Bounty
                </TabsTrigger>
                <TabsTrigger
                  value="issue"
                  className="rounded-3xl text-xs cursor-pointer"
                  aria-label="Show issue activity logs"
                >
                  Issue
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full w-full">
              <div className="p-4">
                <div className="timeline-container relative">
                  <div className="absolute top-0 bottom-0 left-[22px] w-0.5 bg-white/30" />

                  {filteredLogs.map((log, index) => {
                    const { Icon, iconColor, dotColor, label, pulseColor } =
                      typeMeta[log.type];
                    const timeAgo = getTimeAgo(log.timestamp);
                    const isFirst = index === 0;

                    return (
                      <div
                        key={`${log.id}-${index}`}
                        className={`relative mb-6 pl-12 ${
                          isFirst ? 'animate-fade-in' : ''
                        }`}
                      >
                        <div
                          className={`absolute top-0 left-1 z-10 ${
                            isFirst ? `animate-pulse-${pulseColor}` : ''
                          }`}
                        >
                          <div className="relative rounded-full border border-white/50 bg-white/30 p-2 backdrop-blur-md">
                            <Icon className={`h-5 w-5 ${iconColor}`} />
                            <span
                              className={`-top-1 -right-1 absolute h-2.5 w-2.5 rounded-full ${dotColor} border-2 border-white ${
                                isFirst ? 'animate-ping-slow' : ''
                              }`}
                            />
                          </div>
                        </div>

                        <div className="rounded-lg border border-white/30 bg-white/20 p-3 backdrop-blur-md">
                          <div className="mb-2 flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={`https://github.com/${log.user}.png`}
                                alt={log.user}
                              />
                              <AvatarFallback>
                                {log.user.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-semibold text-gray-800 text-sm">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a
                                    href={`https://github.com/${log.user}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline"
                                  >
                                    @{log.user}
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                  View GitHub profile
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <Badge
                              variant="secondary"
                              className="border-none bg-white/30 backdrop-blur-md"
                            >
                              {label}
                            </Badge>
                            {isFirst && (
                              <Badge className="ml-auto bg-green-500/20 text-green-600">
                                Latest
                              </Badge>
                            )}
                          </div>

                          <div className="mb-2 text-gray-800 text-sm">
                            {log.description}
                          </div>

                          <div className="flex items-center justify-between text-gray-700 text-xs">
                            <div>{formatDate(log.timestamp)}</div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 bg-white/30 backdrop-blur-md"
                              >
                                <Clock className="h-3 w-3" />
                                {timeAgo}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="-translate-x-1/2 absolute bottom-0 left-[22px] transform">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute h-3 w-3 animate-ping rounded-full bg-blue-500" />
                      <div className="relative h-3 w-3 rounded-full bg-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="flex shrink-0 items-center justify-between border-white/20 border-t bg-white/10 p-3 backdrop-blur-md">
            <div className="max-w-[180px] truncate text-gray-700 text-xs sm:max-w-full">
              Live updates • Last activity:{' '}
              {fetchedLogs[0] ? getTimeAgo(fetchedLogs[0].timestamp) : 'N/A'}
            </div>
          </CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  );
}
