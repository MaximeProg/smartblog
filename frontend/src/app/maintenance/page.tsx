import { Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-4">
      <div className="max-w-md text-center">
        <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center mx-auto mb-6">
          <Wrench className="h-7 w-7 text-blue-500 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          We&apos;ll be right back
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed">
          SmarterBloggers is currently undergoing scheduled maintenance. We&apos;re working to get things back up
          as quickly as possible — please check back shortly.
        </p>
      </div>
    </div>
  );
}
