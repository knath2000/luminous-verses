'use client';

import React, { ReactNode } from 'react';

interface SettingsSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

export function SettingsSection({ title, icon, children }: SettingsSectionProps) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-2xl" role="img" aria-label={title.toLowerCase().replace(/\s/g, '-')}>
          {icon}
        </span>
        {title}
      </h3>
      
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}