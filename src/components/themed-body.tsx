
'use client';

import { useSettings } from '@/context/settings-context';
import { cn } from "@/lib/utils";

export const ThemedBody = ({ children }: { children: React.ReactNode }) => {
  const { settings, isMounted } = useSettings();

  if (!isMounted) {
    // Render a static version on the server and during initial client render
    return (
      <div
        className={cn(
          "h-full",
          "animations-enabled"
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "h-full",
        settings.theme,
        "animations-enabled",
        settings.backgroundAnimationsEnabled && 'background-animations-enabled'
      )}
      style={{
        backgroundImage: settings.backgroundAnimationsEnabled 
          ? `linear-gradient(-45deg, hsl(var(--background)), hsl(var(--muted)), hsl(var(--background)))`
          : 'none'
      }}
    >
      {children}
    </div>
  );
};
