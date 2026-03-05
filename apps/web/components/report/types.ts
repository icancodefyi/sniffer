export interface CaseData {
  case_id: string;
  created_at: number;
  anonymous: boolean;
  platform_source: string;
  issue_type: string;
  description?: string | null;
}

export interface AnalysisResult {
  case_id: string;
  file_hash: string;
  file_size: number;
  mime_type: string;
  timestamp: number;
  authenticity_score: number;
  risk_level: string;
  manipulation_probability: number;
  c2pa_status: string;
  metadata_integrity: string;
  explanation: string;
  signals: Record<string, unknown>;
}
