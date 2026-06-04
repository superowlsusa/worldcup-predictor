export type Fixture = {
  id: string;
  match_no: number;
  stage: string;
  group_name: string | null;
  home_team: string;
  away_team: string;
  kickoff_utc: string;
  venue_city: string | null;
  venue_country: string | null;
  home_score: number | null;
  away_score: number | null;
  status: 'scheduled' | 'in_progress' | 'final';
};

export type Prediction = {
  id: string;
  fixture_id: string;
  user_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points: number;
};

export type Standing = {
  user_id: string;
  display_name: string;
  total_points: number;
  exact_scores: number;
  correct_outcomes: number;
  predictions_made: number;
};
