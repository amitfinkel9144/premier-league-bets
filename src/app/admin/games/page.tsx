// src/app/admin/games/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Match = {
  id: number;
  matchday: number;
  match_date: string;
  home_team: string;
  away_team: string;
  actual_home_score: number | null;
  actual_away_score: number | null;
};

export default function AdminGamesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [newMatch, setNewMatch] = useState({
    home_team: '',
    away_team: '',
    match_date: '',
  });
  const [editedScores, setEditedScores] = useState<Record<number, { home: number; away: number }>>({});
  const router = useRouter();

  useEffect(() => {
    const fetchMatches = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: adminCheck } = await supabase
        .from('authorized_emails')
        .select('*')
        .eq('email', user.email)
        .eq('role', 'admin')
        .maybeSingle();

      if (!adminCheck) {
        router.push('/');
        return;
      }

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });

      if (!error && data) {
        setMatches(data as Match[]);
        const initial: Record<number, { home: number; away: number }> = {};
        data.forEach((m: Match) => {
          initial[m.id] = {
            home: m.actual_home_score ?? 0,
            away: m.actual_away_score ?? 0,
          };
        });
        setEditedScores(initial);
      }
    };

    fetchMatches();
  }, [router]);

  const handleAddMatch = async () => {
    if (!newMatch.home_team || !newMatch.away_team || !newMatch.match_date) return;
    const { error } = await supabase.from('matches').insert([newMatch]);
    if (!error) {
      setNewMatch({ home_team: '', away_team: '', match_date: '' });
      location.reload();
    }
  };

  const handleUpdateScore = async (matchId: number) => {
    const scores = editedScores[matchId];
    const { error } = await supabase
      .from('matches')
      .update({
        actual_home_score: scores.home,
        actual_away_score: scores.away,
      })
      .eq('id', matchId);
    if (!error) location.reload();
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="bg-white rounded-2xl shadow p-6 w-full max-w-3xl">
        <h1 className="text-xl font-bold mb-4">ניהול משחקים</h1>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="בית"
            className="border p-2 rounded w-1/3"
            value={newMatch.home_team}
            onChange={(e) => setNewMatch({ ...newMatch, home_team: e.target.value })}
          />
          <input
            type="text"
            placeholder="חוץ"
            className="border p-2 rounded w-1/3"
            value={newMatch.away_team}
            onChange={(e) => setNewMatch({ ...newMatch, away_team: e.target.value })}
          />
          <input
            type="datetime-local"
            className="border p-2 rounded w-1/3"
            value={newMatch.match_date}
            onChange={(e) => setNewMatch({ ...newMatch, match_date: e.target.value })}
          />
          <button onClick={handleAddMatch} className="bg-blue-600 text-white px-4 py-2 rounded">
            הוסף
          </button>
        </div>

        <table className="w-full text-sm text-center">
          <thead className="border-b">
            <tr>
              <th>תאריך</th>
              <th>משחק</th>
              <th>תוצאה אמת</th>
              <th>עדכון</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.id} className="border-b">
                <td>{new Date(match.match_date).toLocaleString('he-IL')}</td>
                <td>{match.home_team} נגד {match.away_team}</td>
                <td className="flex justify-center gap-1">
                  <input
                    type="number"
                    value={editedScores[match.id]?.home ?? ''}
                    onChange={(e) => setEditedScores((prev) => ({
                      ...prev,
                      [match.id]: {
                        ...prev[match.id],
                        home: parseInt(e.target.value) || 0,
                      },
                    }))}
                    className="border w-12 p-1 rounded text-center"
                  />
                  <span>:</span>
                  <input
                    type="number"
                    value={editedScores[match.id]?.away ?? ''}
                    onChange={(e) => setEditedScores((prev) => ({
                      ...prev,
                      [match.id]: {
                        ...prev[match.id],
                        away: parseInt(e.target.value) || 0,
                      },
                    }))}
                    className="border w-12 p-1 rounded text-center"
                  />
                </td>
                <td>
                  <button
                    onClick={() => handleUpdateScore(match.id)}
                    className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded"
                  >
                    שמור
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={() => router.push('/')}
          className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
        >
          חזרה לדף הבית
        </button>
      </div>
    </main>
  );
}
