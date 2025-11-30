"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-[#0a0a0a] border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-opacity-80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link
              href="/"
              className="flex-shrink-0 flex items-center font-bold text-xl text-green-500 tracking-tighter font-mono"
            >
              &lt;LeetScroll /&gt;
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="border-transparent text-gray-400 hover:text-green-400 hover:border-green-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors font-mono"
              >
                Feed
              </Link>
              <Link
                href="/leaderboard"
                className="border-transparent text-gray-400 hover:text-green-400 hover:border-green-500 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors font-mono"
              >
                Leaderboard
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400 font-mono">
                  Score:{" "}
                  <span className="font-bold text-green-500">
                    {session.user.score || 0}
                  </span>
                </span>
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="text-sm text-gray-400 hover:text-white transition-colors font-mono"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="text-sm text-red-500 hover:text-red-400 transition-colors font-mono"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  href="/login"
                  className="text-gray-400 hover:text-white text-sm font-medium transition-colors font-mono"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="bg-green-600 text-black px-4 py-2 rounded-md text-sm font-bold hover:bg-green-500 transition-colors font-mono"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden bg-[#0a0a0a] border-b border-gray-800">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="bg-gray-900 border-green-500 text-green-400 block pl-3 pr-4 py-2 border-l-4 text-base font-medium font-mono"
              onClick={() => setIsMenuOpen(false)}
            >
              Feed
            </Link>
            <Link
              href="/leaderboard"
              className="border-transparent text-gray-400 hover:bg-gray-800 hover:border-gray-300 hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium font-mono"
              onClick={() => setIsMenuOpen(false)}
            >
              Leaderboard
            </Link>
          </div>
          <div className="pt-4 pb-4 border-t border-gray-800">
            {session ? (
              <div className="space-y-1">
                <div className="px-4 flex items-center justify-between">
                  <span className="text-base font-medium text-gray-300 font-mono">
                    {session.user.name}
                  </span>
                  <span className="text-sm text-gray-400 font-mono">
                    Score:{" "}
                    <span className="font-bold text-green-500">
                      {session.user.score || 0}
                    </span>
                  </span>
                </div>
                <div className="mt-3 space-y-1">
                  {session.user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-base font-medium text-gray-400 hover:text-white hover:bg-gray-800 font-mono"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-red-500 hover:text-red-400 hover:bg-gray-800 font-mono"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-1 px-4">
                <Link
                  href="/login"
                  className="block w-full text-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-green-600 bg-gray-900 hover:bg-gray-800 font-mono mb-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="block w-full text-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-black bg-green-600 hover:bg-green-500 font-mono"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
