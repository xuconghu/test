export interface AssessmentQuestion {
  id: string;
  category: string;       // Main category, e.g., '一、感知潜能'
  subCategory: string;    // Sub-category, e.g., '感知接收能力'
  text: string;           // The specific question text, e.g., '它可以观察周围环境。'
}

export interface RobotImage {
  id: string;
  filename: string;
  name: string;
}

export interface StoredRobotAssessment {
  robotId: string;
  robotName: string;
  robotImageUrl: string; 
  timestamp: string;
  sliderValues: number[]; 
  shuffledQuestionsSnapshot: AssessmentQuestion[]; 
  overallScore: number;
  userName: string;
  userAge: number;
  userGender: string;
  userMajor: string;
}

export interface AssessmentResult {
  robotId: string;
  robotName: string;
  timestamp: string;
  scores: Record<string, number>;
}

export interface AssessmentSession {
  selectedRobots: RobotImage[];
  currentRobotIndex: number;
  completedAssessments: StoredRobotAssessment[];
}
