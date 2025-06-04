'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Score = {
  user_id: string;
  username: string;
  exact_hits: number;
  direction_hits: number;
  total_points: number;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('user_scores')
        .select('*');

      if (error) {
        console.error('שגיאה בטעינת טבלת ניקוד:', error.message);
      } else if (data) {
        setScores(data as Score[]);
      }
    };

    fetchScores();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-6 text-center">
        <h2 className="text-xl font-bold mb-4">
          <span className="text-yellow-500">🏆</span> טבלת ניקוד
        </h2>
        <table className="w-full text-sm rtl text-right">
          <thead>
            <tr className="border-b">
              <th className="px-2 py-1">כינוי</th>
              <th className="px-2 py-1">בול</th>
              <th className="px-2 py-1">כיוון</th>
              <th className="px-2 py-1">ניקוד</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score) => (
              <tr
                key={score.user_id}
                className="bg-gray-100 hover:bg-gray-200 transition-all"
              >
                <td className="px-2 py-1 font-medium">{score.username}</td>
                <td className="px-2 py-1 text-center">{score.exact_hits}</td>
                <td className="px-2 py-1 text-center">{score.direction_hits}</td>
                <td className="px-2 py-1 text-center font-bold">{score.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={() => router.push('/')}
          className="mt-6 w-full bg-gray-700 hover:bg-gray-800 text-white py-2 px-4 rounded"
        >
          חזרה לדף הבית
        </button>
      </div>
    </main>
  );
}
