import React from 'react';
import SidebarLeft from './SidebarLeft';
import SidebarRight from './SidebarRight';

interface MainLayoutProps {
  children: React.ReactNode;
  currentTab: 'home' | 'explore' | 'bookmarks';
  setCurrentTab: (tab: 'home' | 'explore' | 'bookmarks') => void;
  onPostClick?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentTab,
  setCurrentTab,
  onPostClick,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="app-container">
      {/* Left Navigation Sidebar */}
      <SidebarLeft
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onPostClick={onPostClick}
      />

      {/* Center Feed Component */}
      <main className="feed-container">
        {children}
      </main>

      {/* Right Search & Trends Sidebar */}
      <SidebarRight
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    </div>
  );
};

export default MainLayout;
