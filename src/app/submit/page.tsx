'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

type Match = {
  id: number;
  home_team: string;
  away_team: string;
  match_date: string;
  matchday: number;
};

export default function SubmitPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<number, { home: number; away: number }>>({});
  const [submitted, setSubmitted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      const now = new Date().toISOString();

      const { data: upcoming } = await supabase
        .from('matches')
        .select('*')
        .gte('match_date', now)
        .order('matchday', { ascending: true });

      if (!upcoming || upcoming.length === 0) return;

      const nextMatchday = upcoming[0].matchday;
      const filtered = upcoming.filter((m) => m.matchday === nextMatchday);
      setMatches(filtered);

      const { data: existingPredictions } = await supabase
        .from('predictions')
        .select('match_id, predicted_home_score, predicted_away_score')
        .eq('user_id', user.id);

      if (existingPredictions) {
        const initial: Record<number, { home: number; away: number }> = {};
        existingPredictions.forEach((p) => {
          initial[p.match_id] = {
            home: p.predicted_home_score,
            away: p.predicted_away_score,
          };
        });
        setPredictions(initial);
      }
    };

    fetchInitialData();
  }, []);

  const handleChange = (matchId: number, field: 'home' | 'away', value: string) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: parseInt(value) || 0,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!userId) return;

    const newPredictions = Object.entries(predictions).map(([matchId, score]) => ({
      user_id: userId,
      match_id: parseInt(matchId),
      predicted_home_score: score.home,
      predicted_away_score: score.away,
    }));

    const { error } = await supabase
      .from('predictions')
      .upsert(newPredictions, { onConflict: 'user_id,match_id' });

    if (!error) setSubmitted(true);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 py-8">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-6">הימורים למחזור הקרוב</h1>

        {matches.length === 0 ? (
          <p className="mb-6 text-gray-600">אין כרגע משחקים פתוחים להימור.</p>
        ) : (
          matches.map((match) => {
            const isLocked = new Date(match.match_date).getTime() - Date.now() < 60 * 60 * 1000;

            return (
              <div key={match.id} className="mb-4">
                <p className="font-semibold mb-2">
                  {match.home_team} נגד {match.away_team}
                  {isLocked && <span className="text-red-500 text-sm ml-2">[נעול]</span>}
                </p>
                <div className="flex justify-center gap-4">
                  <input
                    type="number"
                    min="0"
                    disabled={isLocked}
                    className="border p-2 rounded w-16 text-center"
                    placeholder="בית"
                    value={predictions[match.id]?.home ?? ''}
                    onChange={(e) => handleChange(match.id, 'home', e.target.value)}
                  />
                  <input
                    type="number"
                    min="0"
                    disabled={isLocked}
                    className="border p-2 rounded w-16 text-center"
                    placeholder="חוץ"
                    value={predictions[match.id]?.away ?? ''}
                    onChange={(e) => handleChange(match.id, 'away', e.target.value)}
                  />
                </div>
              </div>
            );
          })
        )}

        {matches.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={submitted}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-6"
          >
            {submitted ? 'הניחושים נשמרו בהצלחה!' : 'שמור הימורים'}
          </button>
        )}

        <Link href="/" className="block mt-4">
          <button className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
            חזרה לדף הבית
          </button>
        </Link>
      </div>
    </main>
  );
}
