/* ── Types for the FastAPI Chat Analysis backend ── */

export interface ChatStats {
  total_messages: number;
  total_words: number;
  media_shared: number;
  links_shared: number;
  deleted_messages: number;
  total_days: number;
}

export interface RiskClinicalNote {
  category_label: string;
  direction: 'self' | 'toward others';
  clinical_note: string;
  phrases_found: string[];
}

export interface RiskFlaggedMessage {
  date: string;
  message_text: string;
  category_labels: string[];
  this_message_severity: string;
}

export interface PersonRisk {
  person: string;
  person_is_at_risk: boolean;
  person_poses_risk_to_others: boolean;
  plain_english_summary: string;
  risk_is_escalating: boolean;
  escalation_note: string;
  clinical_notes: RiskClinicalNote[];
  flagged_messages: RiskFlaggedMessage[];
}

export interface RiskData {
  overall_risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical';
  overall_risk_score_0_to_100: number;
  overall_summary: string;
  conversation_escalating: boolean;
  per_person_risk: PersonRisk[];
}

export interface PersonMentalHealth {
  person: string;
  mental_health_score: number;
  mh_score_interpretation: string;
  late_night_messages: number;
  late_night_percent: number;
  avg_words_per_message: number;
  deleted_messages: number;
  clinical_flags: string[];
  positive_language_signals: string[];
  negative_language_signals: string[];
}

export interface MentalHealthData {
  per_person: PersonMentalHealth[];
}

export interface SentimentAggregate {
  overall_label: 'positive' | 'neutral' | 'negative';
  avg_score_0_100: number;
  sentiment_volatility: number;
  tone_distribution: Record<string, number>;
  positivity_ratio: number;
  negativity_ratio: number;
}

export interface SentimentPerSender {
  sender: string;
  overall_label: string;
  score_0_100: number;
}

export interface SentimentData {
  aggregate: SentimentAggregate;
  per_sender: SentimentPerSender[];
}

export interface HourActivity {
  hour: number;
  count: number;
}

export interface WeekActivity {
  day: string;
  count: number;
}

export interface MonthlyTimeline {
  period: string;
  count: number;
}

export interface LateNightSenderStat {
  sender: string;
  count: number;
  percent: number;
}

export interface LateNightStats {
  total_late_night_msgs: number;
  per_sender: LateNightSenderStat[];
}

export interface TopWord {
  word: string;
  count: number;
}

export interface TopEmoji {
  emoji: string;
  count: number;
}

export interface VocabularyRichness {
  sender: string;
  lexical_diversity: number;
  unique_words: number;
  total_words: number;
}

export interface ResponseTime {
  sender: string;
  avg_response_min: number;
  median_response_min: number;
}

export interface InitiatorStat {
  sender: string;
  initiations: number;
  percent: number;
}

export interface SilentPeriod {
  from: string;
  to: string;
  gap_hours: number;
}

export interface MostActive {
  user: string;
  messages: number;
  percent: number;
}

export interface ChatAnalysisResult {
  session_id: string;
  stats: ChatStats;
  risk: RiskData;
  mental_health: MentalHealthData;
  sentiment: SentimentData;
  most_active: MostActive[];
  monthly_timeline: MonthlyTimeline[];
  daily_timeline: { only_date: string; count: number }[];
  week_activity: WeekActivity[];
  hour_activity: HourActivity[];
  top_words: TopWord[];
  top_emojis: TopEmoji[];
  late_night_stats: LateNightStats;
  vocabulary_richness: VocabularyRichness[];
  response_time: ResponseTime[];
  initiator_stats: InitiatorStat[];
  silent_periods: SilentPeriod[];
  participants: string[];
}
