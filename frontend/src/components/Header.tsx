import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              AgentDMS Admin
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{user?.name}</span>
              <span className="text-gray-500 ml-2">({user?.role})</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;