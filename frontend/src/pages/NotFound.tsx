import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="mt-4 text-3xl font-bold text-gray-700">
            Page not found
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Sorry, we couldn't find the page you're looking for.
          </p>
          
          <div className="mt-8 space-y-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Dashboard
            </Link>
            
            <div>
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Or sign in to your account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;