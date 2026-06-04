import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { navConfig } from '../../config/navConfig';
import { NavItem } from '../../types';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../stores/appStore';

const IconComponent = ({ name, className }: { name: string; className?: string }) => {
  const IconMap = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const Icon = IconMap[name];
  return Icon ? <Icon className={className} /> : null;
};

interface SidebarItemProps {
  item: NavItem;
  collapsed: boolean;
}

const SidebarItem = ({ item, collapsed }: SidebarItemProps) => {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const isActive = hasChildren
    ? item.children?.some(child => location.pathname === child.path)
    : location.pathname === item.path;

  if (hasChildren) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
            isActive
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          )}
        >
          <IconComponent name={item.icon} className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="ml-3 flex-1 text-left">{item.label}</span>
              <Icons.ChevronDown
                className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')}
              />
            </>
          )}
        </button>
        {expanded && !collapsed && (
          <div className="mt-1 ml-4 space-y-1">
            {item.children?.map(child => (
              <NavLink
                key={child.key}
                to={child.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-4 py-2 text-sm rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  )
                }
              >
                <IconComponent name={child.icon} className="w-4 h-4" />
                <span className="ml-3">{child.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 mb-1',
          isActive
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )
      }
    >
      <IconComponent name={item.icon} className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="ml-3">{item.label}</span>}
    </NavLink>
  );
};

export const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        {!sidebarCollapsed && (
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Icons.Pill className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">智慧药房</h1>
              <p className="text-xs text-gray-500">Smart Pharmacy</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <Icons.Pill className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      <div className="px-3 py-4 overflow-y-auto h-[calc(100vh-4rem)]">
        <nav className="space-y-1">
          {navConfig.map(item => (
            <SidebarItem key={item.key} item={item} collapsed={sidebarCollapsed} />
          ))}
        </nav>
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 z-50"
      >
        {sidebarCollapsed ? (
          <Icons.ChevronRight className="w-4 h-4 text-gray-500" />
        ) : (
          <Icons.ChevronLeft className="w-4 h-4 text-gray-500" />
        )}
      </button>
    </aside>
  );
};
