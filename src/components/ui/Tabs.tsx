import { ReactNode, createContext, useContext, useState } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  children: ReactNode;
  defaultTab: string;
  className?: string;
  onChange?: (tab: string) => void;
}

export function Tabs({ children, defaultTab, className = '', onChange }: TabsProps) {
  const [activeTab, setActiveTabState] = useState(defaultTab);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    onChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: ReactNode;
  className?: string;
}

export function TabList({ children, className = '' }: TabListProps) {
  return (
    <div
      className={`flex gap-1 p-1 bg-gray-100 rounded-lg ${className}`}
      role="tablist"
    >
      {children}
    </div>
  );
}

interface TabProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export function Tab({ children, value, className = '' }: TabProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
        ${isActive ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
        ${className}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

interface TabPanelProps {
  children: ReactNode;
  value: string;
  className?: string;
}

export function TabPanel({ children, value, className = '' }: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');

  const { activeTab } = context;

  if (activeTab !== value) return null;

  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
