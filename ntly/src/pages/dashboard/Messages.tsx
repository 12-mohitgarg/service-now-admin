import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import {
  MessageSquare,
  Mail,
  Megaphone,
  Calendar,
  Search,
  Filter,
  ChevronRight,
  Bell,
  X,
  Info,
  Clock,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  BookOpen
} from 'lucide-react';

interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  createdAt?: string;
  isActive?: boolean;
  type?: 'announcement' | 'unread' | 'general';
}

export default function Messages() {
  const [messages, setMessages] = useState<NotificationMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Read state from localStorage
  const [readIds, setReadIds] = useState<string[]>([]);
  
  // UI states
  const [selectedMessage, setSelectedMessage] = useState<NotificationMessage | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'announcements' | 'general'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date filter states
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    fetchMessages();
    const stored = JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
    setReadIds(stored);
  }, []);

  const fetchMessages = async () => {
    try {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as NotificationMessage))
        .filter(msg => msg.isActive !== false);

      setMessages(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark single message as read
  const markAsRead = (id: string) => {
    if (readIds.includes(id)) return;
    const updated = [...readIds, id];
    setReadIds(updated);
    localStorage.setItem('readNotificationIds', JSON.stringify(updated));
    // Trigger storage event to update Sidebar/Navbar badges immediately
    window.dispatchEvent(new Event('storage'));
  };

  // Date filtering helper
  const filterByDate = (msgDateStr?: string) => {
    if (!msgDateStr) return true;
    const msgDate = new Date(msgDateStr);
    const today = new Date();
    
    // Clear times for exact day matching
    today.setHours(0,0,0,0);
    const msgDay = new Date(msgDateStr);
    msgDay.setHours(0,0,0,0);

    if (dateRange === 'today') {
      return msgDay.getTime() === today.getTime();
    }
    if (dateRange === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      return msgDay >= oneWeekAgo;
    }
    if (dateRange === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(today.getMonth() - 1);
      return msgDay >= oneMonthAgo;
    }
    if (dateRange === 'custom') {
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        return msgDate >= start && msgDate <= end;
      }
    }
    return true;
  };

  // Filter messages based on search, tabs & date
  const filteredMessages = messages.filter(msg => {
    const isUnread = !readIds.includes(msg.id);
    const matchesSearch = msg.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          msg.message?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = filterByDate(msg.createdAt);

    // Tab matching
    if (activeTab === 'unread') return matchesSearch && isUnread && matchesDate;
    if (activeTab === 'announcements') return matchesSearch && matchesDate; // All notifications from admin are announcements
    if (activeTab === 'general') return false; // Placeholder for other tags if any
    return matchesSearch && matchesDate;
  });

  // Pagination calculation
  const totalFiltered = filteredMessages.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedMessages = filteredMessages.slice(startIndex, startIndex + pageSize);

  // Metrics
  const totalCount = messages.length;
  const unreadCount = messages.filter(msg => !readIds.includes(msg.id)).length;
  const announcementsCount = messages.length; // Notifications are announcements
  const latestDateStr = messages[0]?.createdAt 
    ? new Date(messages[0].createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';

  const handleMessageClick = (msg: NotificationMessage) => {
    markAsRead(msg.id);
    setSelectedMessage(msg);
  };

  // Helper date formatter
  const formatMsgDate = (dateStr?: string) => {
    if (!dateStr) return { date: 'N/A', time: '' };
    const dateObj = new Date(dateStr);
    return {
      date: dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Description Header Banner */}
      <div className="select-none">
        <h2 className="text-xl font-black text-slate-900">Messages</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Stay updated with important announcements and messages from your admin.
        </p>
      </div>

      {/* Main Two Column Grid (Left: Message Board (3/4), Right: Announcement Sidebar (1/4)) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT/CENTER MAIN COLUMN */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* 1. METRICS CARDS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
            {/* Total Messages */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/50 shadow-sm flex items-center gap-3 relative overflow-hidden">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 flex-shrink-0">
                <MessageSquare size={16} />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Total Messages</span>
                <h4 className="text-base font-black text-slate-800 mt-0.5">{totalCount}</h4>
                <span className="text-[8px] text-slate-400 font-medium block">All time</span>
              </div>
            </div>

            {/* Unread Messages */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/50 shadow-sm flex items-center gap-3 relative overflow-hidden">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center border border-green-100 flex-shrink-0">
                <Mail size={16} />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Unread</span>
                <h4 className="text-base font-black text-slate-800 mt-0.5">{unreadCount}</h4>
                <span className="text-[8px] text-green-600 font-bold block uppercase">New</span>
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/50 shadow-sm flex items-center gap-3 relative overflow-hidden">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center border border-orange-100 flex-shrink-0">
                <Megaphone size={16} />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Announcements</span>
                <h4 className="text-base font-black text-slate-800 mt-0.5">{announcementsCount}</h4>
                <span className="text-[8px] text-slate-400 font-medium block">From Admin</span>
              </div>
            </div>

            {/* Recent Message Date */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200/50 shadow-sm flex items-center gap-3 relative overflow-hidden">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100 flex-shrink-0">
                <Calendar size={16} />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Recent Message</span>
                <h4 className="text-xs font-black text-slate-800 mt-0.5">{latestDateStr}</h4>
                <span className="text-[8px] text-slate-400 font-medium block">Last received</span>
              </div>
            </div>
          </div>

          {/* 2. TABS & FILTER ACTIONS PANEL */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/50 shadow-sm space-y-6">
            
            {/* Top Toolbar: Search, Filters, and Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 relative">
              
              {/* Category Tabs Toggles */}
              <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs font-bold text-slate-600 self-start sm:self-auto select-none">
                <button
                  onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
                  className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'hover:bg-slate-100/50'
                  }`}
                >
                  All Messages
                </button>
                <button
                  onClick={() => { setActiveTab('unread'); setCurrentPage(1); }}
                  className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'unread' ? 'bg-white text-slate-800 shadow-sm' : 'hover:bg-slate-100/50'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => { setActiveTab('announcements'); setCurrentPage(1); }}
                  className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                    activeTab === 'announcements' ? 'bg-white text-slate-800 shadow-sm' : 'hover:bg-slate-100/50'
                  }`}
                >
                  Announcements
                </button>
              </div>

              {/* Actions Right: Search and Date Filter */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                
                {/* Search query box */}
                <div className="relative flex-1 sm:flex-none">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold w-full sm:w-48 bg-white text-slate-800 outline-none focus:border-blue-500 shadow-sm transition"
                  />
                </div>

                {/* Filter Date Button with Dropdown Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={`h-9 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                      dateRange !== 'all' 
                        ? 'bg-blue-50 text-blue-600 border-blue-200' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Filter size={13} />
                    <span>Filter</span>
                  </button>

                  {/* Date Filter Dropdown Overlay */}
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-150 rounded-2xl shadow-xl p-4 z-30 space-y-3 animate-scale-up select-none">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Filter by Date</span>
                        <button onClick={() => setShowFilterDropdown(false)} className="text-slate-400 hover:text-slate-700">
                          <X size={14} />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {/* Range select dropdown */}
                        <label className="text-[9px] font-bold text-slate-400 block uppercase">Date Range</label>
                        <select
                          value={dateRange}
                          onChange={(e) => {
                            setDateRange(e.target.value as any);
                            setCurrentPage(1);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-slate-750"
                        >
                          <option value="all">All Dates</option>
                          <option value="today">Today</option>
                          <option value="week">Last 7 Days</option>
                          <option value="month">Last 30 Days</option>
                          <option value="custom">Custom Range</option>
                        </select>
                      </div>

                      {/* Custom inputs */}
                      {dateRange === 'custom' && (
                        <div className="grid grid-cols-2 gap-2 pt-2 animate-scale-up">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase">Start Date</label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] font-semibold text-slate-750"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase">End Date</label>
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[10px] font-semibold text-slate-750"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* 3. MESSAGES LIST */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-10 text-slate-400 font-semibold text-sm">
                  Loading message archive...
                </div>
              ) : paginatedMessages.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-150 rounded-3xl select-none">
                  <Mail size={40} className="mx-auto mb-3 text-slate-300" />
                  <h4 className="font-extrabold text-sm text-slate-700">No messages found</h4>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">Your admin announcements index will appear here.</p>
                </div>
              ) : (
                paginatedMessages.map((msg) => {
                  const isUnread = !readIds.includes(msg.id);
                  const { date, time } = formatMsgDate(msg.createdAt);
                  
                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleMessageClick(msg)}
                      className={`flex items-start justify-between p-4 rounded-2xl border transition hover:shadow-sm cursor-pointer ${
                        isUnread 
                          ? 'bg-blue-50/15 border-blue-100/70 hover:border-blue-200' 
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Circular themed icon box */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                          isUnread
                            ? 'bg-blue-50 border-blue-100 text-blue-600'
                            : 'bg-slate-50 border-slate-100 text-slate-400'
                        }`}>
                          <Megaphone size={16} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className={`text-xs md:text-sm truncate text-slate-800 leading-tight ${isUnread ? 'font-black' : 'font-extrabold'}`}>
                              {msg.title}
                            </h5>
                            {isUnread && (
                              <span className="bg-blue-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full leading-none">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-semibold line-clamp-1 max-w-sm md:max-w-md">
                            {msg.message}
                          </p>
                        </div>
                      </div>

                      {/* Right metadata info details */}
                      <div className="flex items-center gap-4 flex-shrink-0 text-right pl-3 select-none">
                        <div className="flex flex-col text-[10px]">
                          <span className="text-slate-700 font-bold leading-none">{date}</span>
                          <span className="text-slate-400 font-semibold mt-1 leading-none">{time}</span>
                        </div>

                        {/* Unread indicator dot */}
                        <div className="flex items-center gap-2">
                          {isUnread ? (
                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm shadow-blue-500/20" />
                          ) : (
                            <div className="w-2.5 h-2.5 bg-transparent rounded-full" />
                          )}
                          <ChevronRight size={14} className="text-slate-350" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 4. TABLE PAGINATION CONTROLS */}
            {totalFiltered > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-100 select-none">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
                  >
                    <ChevronsLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg font-bold text-xs transition active:scale-95 cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition active:scale-95 cursor-pointer"
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-lg text-xs font-semibold px-2 py-1.5 text-slate-700 outline-none focus:border-blue-500 shadow-sm cursor-pointer"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={15}>15 per page</option>
                    <option value={20}>20 per page</option>
                  </select>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* RIGHT COLUMN SIDEBAR PANEL (Col 2) */}
        <div className="lg:col-span-1 space-y-6 w-full">
          


          {/* Block 2: Important Announcements Feed list */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm space-y-4 select-none">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">
                Important Feeds
              </h4>
              <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest cursor-pointer hover:underline">
                View All
              </span>
            </div>

            {/* List Feed */}
            <div className="space-y-3.5">
              {messages.slice(0, 3).map((msg) => {
                const dateObj = msg.createdAt ? new Date(msg.createdAt) : new Date();
                const day = dateObj.toLocaleDateString('en-US', { day: '2-digit' });
                const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                return (
                  <div key={msg.id} onClick={() => handleMessageClick(msg)} className="flex items-start gap-3.5 hover:bg-slate-50/50 p-1.5 rounded-xl transition cursor-pointer">
                    {/* Date Block */}
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-black leading-none">{day}</span>
                      <span className="text-[8px] font-bold uppercase mt-0.5 leading-none">{month}</span>
                    </div>

                    <div className="min-w-0">
                      <h5 className="font-extrabold text-[11px] text-slate-800 leading-snug line-clamp-1">
                        {msg.title}
                      </h5>
                      <span className="text-[9px] text-slate-450 font-semibold mt-0.5 block leading-none">
                        {time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Block 3: Message Guidelines list */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/50 shadow-sm space-y-4 select-none">
            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-3">
              Message Guidelines
            </h4>
            <ol className="list-decimal pl-4 text-[10px] text-slate-500 font-semibold space-y-2 leading-relaxed">
              <li>Check messages regularly for new schedule updates.</li>
              <li>Official course circulars will be sent here directly.</li>
              <li>For any queries, contact support center.</li>
            </ol>

            {/* Guidelines Bottom Alert Info Box */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5 mt-2">
              <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-[9px] text-slate-500 leading-normal font-semibold">
                Admin will never ask for your student login password or personal credentials.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* 5. SLIDE-OUT MESSAGE DETAIL DRAWER MODAL OVERLAY */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-2xl relative animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Megaphone size={16} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Admin Announcement</h4>
                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Official release notice</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-6 space-y-4 select-text">
              <h3 className="font-black text-sm md:text-base text-slate-800 leading-snug">
                {selectedMessage.title}
              </h3>
              
              <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold select-none py-1 border-y border-slate-50">
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {formatMsgDate(selectedMessage.createdAt).date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {formatMsgDate(selectedMessage.createdAt).time}
                </span>
              </div>

              <p className="text-xs text-slate-600 font-semibold leading-relaxed pt-2 white-space-pre-line">
                {selectedMessage.message}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-end select-none">
              <button
                onClick={() => setSelectedMessage(null)}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm shadow-blue-500/10"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
