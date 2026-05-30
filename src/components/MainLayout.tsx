import React from 'react';
import SidebarLeft from './SidebarLeft';
import SidebarRight from './SidebarRight';

interface MainLayoutProps {
  children: React.ReactNode;
  currentTab: 'home' | 'explore' | 'bookmarks';
  setCurrentTab: (tab: 'home' | 'explore' | 'bookmarks') => void;
  onPostClick?: () => void;
  onHashtagClick?: (tagName: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showSidebarComposer?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentTab,
  setCurrentTab,
  onPostClick,
  onHashtagClick,
  searchQuery,
  setSearchQuery,
  showSidebarComposer = true,
}) => {
  return (
    <div className="app-container">
      {/* Left Search & Compose Sidebar (previously SidebarRight) */}
      <SidebarRight
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showComposer={showSidebarComposer}
        onHashtagClick={onHashtagClick}
      />

      {/* Center Feed Component */}
      <main className="feed-container">
        {children}
      </main>

      {/* Right Navigation Sidebar (previously SidebarLeft) */}
      <SidebarLeft
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onPostClick={onPostClick}
      />
    </div>
  );
};

export default MainLayout;
