'use client';

import { FC } from 'react';

export const Footer: FC = () => {
  return (
    <footer className="mt-16 py-8 bg-white/5">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-[var(--subtext-color)] text-center md:text-left">
            © 2024 Coin Pusher 2000. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-[var(--subtext-color)] hover:text-[var(--primary-color)] transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-[var(--subtext-color)] hover:text-[var(--primary-color)] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-[var(--subtext-color)] hover:text-[var(--primary-color)] transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
