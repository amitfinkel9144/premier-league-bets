// ✅ קובץ: src/app/page.tsx - מסך בית
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        router.push('/login');
        return;
      }
      setEmail(user.email || '');
      const { data: adminData } = await supabase
        .from('authorized_emails')
        .select('*')
        .eq('email', user.email)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!adminData);
    };
    fetchUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full text-center">
        <img src="/images/logo.jpeg" alt="לוגו" className="w-24 h-24 mx-auto mb-4 rounded-full shadow" />
        <h1 className="text-3xl font-bold mb-2">Welcome </h1>
        <p className="text-gray-600 mb-6">{email}</p>

        <div className="flex flex-col gap-4 text-right">
          <a href="/submit">
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"> שליחת ניחושים</button>
          </a>
          <a href="/results">
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"> תוצאות העונה</button>
          </a>
          <a href="/leaderboard">
            <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"> טבלת ניקוד</button>
          </a>
          <a href="/profile">
            <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"> פרופיל אישי</button>
          </a>
          {isAdmin && (
            <a href="/admin/games">
              <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"> ניהול משחקים</button>
            </a>
          )}
        </div>

        <button onClick={handleSignOut} className="mt-8 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded w-full">
           התנתקות
        </button>
      </div>
    </main>
  );
}
