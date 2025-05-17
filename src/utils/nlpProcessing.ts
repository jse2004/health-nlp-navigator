
// Mock NLP processing functions to simulate medical text analysis
// In a real application, these would connect to actual NLP models or APIs

interface NLPEntity {
  text: string;
  type: string;
  confidence: number;
}

interface NLPSentiment {
  score: number; // -1 to 1 where 1 is very positive and -1 is very negative
  magnitude: number; // 0 to +inf, indicating strength of sentiment
}

interface NLPAnalysisResult {
  entities: NLPEntity[];
  sentiment: NLPSentiment;
  keyPhrases: string[];
  suggestedDiagnosis?: string[];
  severity?: number; // 1-10 scale
}

/**
 * Analyzes medical text to extract entities, sentiment and key information
 */
export const analyzeMedicalText = (text: string): NLPAnalysisResult => {
  // In a real application, this would call an NLP API
  // This is a mock implementation for demonstration purposes
  
  // Mock entity extraction
  const entities = extractEntities(text);
  
  // Mock sentiment analysis
  const sentiment = analyzeSentiment(text);
  
  // Mock key phrase extraction
  const keyPhrases = extractKeyPhrases(text);
  
  // Mock diagnosis suggestions based on the text
  const suggestedDiagnosis = suggestDiagnosis(text);
  
  // Mock severity assessment
  const severity = assessSeverity(text);
  
  return {
    entities,
    sentiment,
    keyPhrases,
    suggestedDiagnosis,
    severity
  };
};

// Mock entity extraction function
const extractEntities = (text: string): NLPEntity[] => {
  const entities: NLPEntity[] = [];
  
  // These would normally be identified by an NLP model
  const medicalTerms = [
    { term: "headache", type: "symptom" },
    { term: "pain", type: "symptom" },
    { term: "fever", type: "symptom" },
    { term: "cough", type: "symptom" },
    { term: "dizziness", type: "symptom" },
    { term: "fatigue", type: "symptom" },
    { term: "blood pressure", type: "vital" },
    { term: "heart rate", type: "vital" },
    { term: "temperature", type: "vital" },
    { term: "breathing", type: "vital" },
    { term: "diabetes", type: "condition" },
    { term: "hypertension", type: "condition" },
    { term: "asthma", type: "condition" },
    { term: "stroke", type: "condition" },
    { term: "lisinopril", type: "medication" },
    { term: "atorvastatin", type: "medication" },
    { term: "topiramate", type: "medication" },
    { term: "anxiety", type: "psychological" },
    { term: "depression", type: "psychological" },
    { term: "sleep", type: "lifestyle" },
    { term: "diet", type: "lifestyle" },
    { term: "exercise", type: "lifestyle" }
  ];
  
  medicalTerms.forEach(term => {
    if (text.toLowerCase().includes(term.term)) {
      // Find the actual case used in the text
      const regex = new RegExp(term.term, "i");
      const match = text.match(regex);
      
      if (match) {
        entities.push({
          text: match[0],
          type: term.type,
          confidence: 0.8 + Math.random() * 0.2 // Generate a random confidence value between 0.8 and 1
        });
      }
    }
  });
  
  return entities;
};

// Mock sentiment analysis function
const analyzeSentiment = (text: string): NLPSentiment => {
  // In a real system, this would use an NLP model
  // For this demo, we'll generate a pseudo-sentiment based on keywords
  
  const concernWords = [
    "severe", "critical", "urgent", "concerning", "worrying", 
    "acute", "emergency", "deteriorating", "serious", "worse"
  ];
  
  const positiveWords = [
    "improving", "stable", "normal", "good", "better", 
    "controlled", "managing", "responsive", "positive", "resolved"
  ];
  
  let concernCount = 0;
  let positiveCount = 0;
  
  concernWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      concernCount++;
    }
  });
  
  positiveWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      positiveCount++;
    }
  });
  
  // Calculate sentiment score (-1 to 1)
  const score = (positiveCount - concernCount) / Math.max(1, (positiveCount + concernCount)) * 2;
  
  // Calculate magnitude (strength of sentiment)
  const magnitude = Math.min(1, (positiveCount + concernCount) / 5);
  
  return { score, magnitude };
};

// Mock key phrase extraction
const extractKeyPhrases = (text: string): string[] => {
  // This would normally be done with NLP techniques
  // For demo, we'll split into sentences and select the shortest 2-3
  
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
  
  // Sort by length and take shortest 2-3 meaningful sentences
  return sentences
    .sort((a, b) => a.length - b.length)
    .slice(0, Math.min(3, sentences.length))
    .map(s => s.trim());
};

// Mock diagnosis suggestion
const suggestDiagnosis = (text: string): string[] => {
  const diagnosisPatterns: { [key: string]: RegExp[] } = {
    "Hypertension": [
      /elevated blood pressure/i,
      /high blood pressure/i,
      /\d{3}\/\d{2,3}/i, // Blood pressure readings like 150/90
    ],
    "Migraine": [
      /migraine/i,
      /headache.+visual/i,
      /aura.+headache/i,
    ],
    "Diabetes": [
      /diabetes/i,
      /elevated (blood )?glucose/i,
      /a1c.+[6-9]\.[0-9]|1[0-9]\.[0-9]/i,
    ],
    "Coronary Artery Disease": [
      /coronary/i,
      /chest (pain|discomfort)/i,
      /angina/i,
    ],
    "Respiratory Infection": [
      /cough.+(fever|phlegm)/i,
      /shortness of breath/i,
      /respiratory/i,
    ],
    "Depression": [
      /depression/i,
      /(feeling|felt) (sad|down|hopeless)/i,
      /loss of interest/i,
    ]
  };
  
  const suggestions: string[] = [];
  
  Object.entries(diagnosisPatterns).forEach(([diagnosis, patterns]) => {
    if (patterns.some(pattern => pattern.test(text))) {
      suggestions.push(diagnosis);
    }
  });
  
  return suggestions;
};

// Mock severity assessment (1-10 scale)
const assessSeverity = (text: string): number => {
  const severeWords = [
    "critical", "severe", "emergency", "immediately", "urgent", "fatal", "life-threatening"
  ];
  
  const moderateWords = [
    "concerning", "moderate", "attention", "elevated", "abnormal", "notable"
  ];
  
  let severity = 5; // Start with moderate severity
  
  // Check for severe indicators
  severeWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      severity += 1;
    }
  });
  
  // Check for moderate indicators
  moderateWords.forEach(word => {
    if (text.toLowerCase().includes(word)) {
      severity += 0.5;
    }
  });
  
  // Look for good indicators that might reduce severity
  if (text.toLowerCase().includes("normal")) severity -= 1;
  if (text.toLowerCase().includes("stable")) severity -= 1;
  if (text.toLowerCase().includes("improving")) severity -= 2;
  
  // Ensure within bounds
  return Math.min(Math.max(Math.round(severity), 1), 10);
};
