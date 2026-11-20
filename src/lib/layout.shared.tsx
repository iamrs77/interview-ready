import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { GraduationCap } from 'lucide-react';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <GraduationCap className="size-5 text-fd-primary" />
          <span className="font-semibold">{appName}</span>
        </>
      ),
    },
    themeSwitch: { enabled: false },
  };
}
