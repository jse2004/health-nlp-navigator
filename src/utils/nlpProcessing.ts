
// Real NLP processing functions that work with actual medical data
// These functions analyze real medical text and provide meaningful insights

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
export const analyzeMedicalText = (text: string | undefined): NLPAnalysisResult => {
  const safeText = text || '';
  
  if (!safeText.trim()) {
    return {
      entities: [],
      sentiment: { score: 0, magnitude: 0 },
      keyPhrases: [],
      suggestedDiagnosis: [],
      severity: 5
    };
  }

  // Real entity extraction
  const entities = extractEntities(safeText);
  
  // Real sentiment analysis
  const sentiment = analyzeSentiment(safeText);
  
  // Real key phrase extraction
  const keyPhrases = extractKeyPhrases(safeText);
  
  // Real diagnosis suggestions based on medical knowledge
  const suggestedDiagnosis = suggestDiagnosis(safeText);
  
  // Real severity assessment
  const severity = assessSeverity(safeText);
  
  return {
    entities,
    sentiment,
    keyPhrases,
    suggestedDiagnosis,
    severity
  };
};

// Real entity extraction using comprehensive medical dictionary
const extractEntities = (text: string): NLPEntity[] => {
  const entities: NLPEntity[] = [];
  
  if (!text) return entities;
  
  // Comprehensive and precise medical terminology database
  const medicalTerms = [
    // Precise symptom terminology
    { patterns: ['cephalgia', 'migraine', 'tension headache', 'cluster headache', 'chronic daily headache'], type: 'symptom' },
    { patterns: ['angina pectoris', 'precordial pain', 'retrosternal pain', 'pleuritic chest pain'], type: 'symptom' },
    { patterns: ['dyspnea on exertion', 'orthopnea', 'paroxysmal nocturnal dyspnea', 'tachypnea'], type: 'symptom' },
    { patterns: ['nausea and vomiting', 'hematemesis', 'bilious vomiting', 'projectile vomiting'], type: 'symptom' },
    { patterns: ['hyperthermia', 'pyrexia', 'febrile episodes', 'low-grade fever', 'high-grade fever'], type: 'symptom' },
    { patterns: ['productive cough', 'dry cough', 'chronic cough', 'hemoptysis', 'nocturnal cough'], type: 'symptom' },
    { patterns: ['vertigo', 'presyncope', 'syncope', 'orthostatic hypotension symptoms'], type: 'symptom' },
    { patterns: ['asthenia', 'generalized weakness', 'chronic fatigue syndrome', 'lethargy'], type: 'symptom' },
    { patterns: ['epigastric pain', 'right upper quadrant pain', 'periumbilical pain', 'suprapubic pain'], type: 'symptom' },
    { patterns: ['polyarthralgia', 'monoarthritis', 'myalgia', 'fibromyalgia', 'arthritis'], type: 'symptom' },
    
    // Additional precise symptoms
    { patterns: ['diplopia', 'blurred vision', 'photophobia', 'visual field defects', 'scotoma'], type: 'symptom' },
    { patterns: ['palpitations', 'arrhythmia symptoms', 'chest fluttering', 'extrasystoles'], type: 'symptom' },
    { patterns: ['polyuria', 'oliguria', 'anuria', 'dysuria', 'hematuria', 'proteinuria'], type: 'symptom' },
    { patterns: ['dysphagia', 'odynophagia', 'gastroesophageal reflux symptoms', 'heartburn'], type: 'symptom' },
    { patterns: ['paresthesia', 'numbness', 'tingling', 'peripheral neuropathy symptoms', 'hyperesthesia'], type: 'symptom' },
    
    // Neurological symptoms
    { patterns: ['ataxia', 'coordination difficulties', 'balance problems', 'gait disturbance'], type: 'symptom' },
    { patterns: ['tremor', 'involuntary movements', 'muscle fasciculations', 'tics'], type: 'symptom' },
    { patterns: ['aphasia', 'dysarthria', 'speech difficulties', 'slurred speech'], type: 'symptom' },
    { patterns: ['seizure', 'convulsions', 'epileptic episodes', 'aura'], type: 'symptom' },
    
    // Gastrointestinal symptoms
    { patterns: ['melena', 'hematochezia', 'bloody stools', 'tarry stools'], type: 'symptom' },
    { patterns: ['diarrhea', 'constipation', 'bowel movement changes', 'fecal incontinence'], type: 'symptom' },
    { patterns: ['jaundice', 'icterus', 'scleral icterus', 'yellowing of skin'], type: 'symptom' },
    
    // Dermatological symptoms
    { patterns: ['rash', 'urticaria', 'pruritus', 'skin lesions', 'erythema'], type: 'symptom' },
    { patterns: ['alopecia', 'hair loss', 'brittle nails', 'skin discoloration'], type: 'symptom' },
    
    // Vital signs and measurements
    { patterns: ['blood pressure', 'bp', 'hypertension', 'hypotension'], type: 'vital' },
    { patterns: ['heart rate', 'pulse', 'tachycardia', 'bradycardia'], type: 'vital' },
    { patterns: ['temperature', 'temp', 'body temperature'], type: 'vital' },
    { patterns: ['respiratory rate', 'breathing rate', 'respiration'], type: 'vital' },
    { patterns: ['oxygen saturation', 'spo2', 'pulse ox'], type: 'vital' },
    
    // Precise medical conditions with ICD-10 terminology
    { patterns: ['diabetes mellitus type 1', 'diabetes mellitus type 2', 'gestational diabetes', 'diabetic ketoacidosis'], type: 'condition' },
    { patterns: ['essential hypertension', 'secondary hypertension', 'malignant hypertension', 'hypertensive crisis'], type: 'condition' },
    { patterns: ['bronchial asthma', 'exercise-induced asthma', 'occupational asthma', 'status asthmaticus'], type: 'condition' },
    { patterns: ['ischemic stroke', 'hemorrhagic stroke', 'transient ischemic attack', 'cerebrovascular accident'], type: 'condition' },
    { patterns: ['acute myocardial infarction', 'non-st elevation myocardial infarction', 'unstable angina'], type: 'condition' },
    { patterns: ['community-acquired pneumonia', 'hospital-acquired pneumonia', 'aspiration pneumonia'], type: 'condition' },
    { patterns: ['migraine with aura', 'migraine without aura', 'chronic migraine', 'medication overuse headache'], type: 'condition' },
    { patterns: ['major depressive disorder', 'persistent depressive disorder', 'bipolar disorder', 'seasonal affective disorder'], type: 'condition' },
    { patterns: ['generalized anxiety disorder', 'panic disorder', 'social anxiety disorder', 'specific phobia'], type: 'condition' },
    
    // Additional precise conditions
    { patterns: ['atrial fibrillation', 'atrial flutter', 'ventricular tachycardia', 'heart failure'], type: 'condition' },
    { patterns: ['chronic obstructive pulmonary disease', 'chronic bronchitis', 'emphysema'], type: 'condition' },
    { patterns: ['rheumatoid arthritis', 'osteoarthritis', 'psoriatic arthritis', 'ankylosing spondylitis'], type: 'condition' },
    { patterns: ['irritable bowel syndrome', 'inflammatory bowel disease', 'crohns disease', 'ulcerative colitis'], type: 'condition' },
    
    // Precise medication terminology with generic and brand names
    { patterns: ['lisinopril', 'enalapril', 'captopril', 'ace inhibitor', 'angiotensin-converting enzyme inhibitor'], type: 'medication' },
    { patterns: ['atorvastatin', 'simvastatin', 'rosuvastatin', 'hmg-coa reductase inhibitor', 'statin'], type: 'medication' },
    { patterns: ['metformin hydrochloride', 'glucophage', 'biguanide antidiabetic'], type: 'medication' },
    { patterns: ['acetylsalicylic acid', 'aspirin', 'antiplatelet agent', 'nsaid'], type: 'medication' },
    { patterns: ['ibuprofen', 'naproxen', 'diclofenac', 'nonsteroidal anti-inflammatory drug'], type: 'medication' },
    { patterns: ['amoxicillin-clavulanate', 'cephalexin', 'azithromycin', 'beta-lactam antibiotic'], type: 'medication' },
    { patterns: ['prednisolone', 'methylprednisolone', 'hydrocortisone', 'systemic corticosteroid'], type: 'medication' },
    
    // Additional medication classes
    { patterns: ['furosemide', 'hydrochlorothiazide', 'loop diuretic', 'thiazide diuretic'], type: 'medication' },
    { patterns: ['levothyroxine', 'thyroid hormone replacement', 'synthroid'], type: 'medication' },
    { patterns: ['insulin', 'rapid-acting insulin', 'long-acting insulin', 'insulin analogue'], type: 'medication' },
    { patterns: ['warfarin', 'apixaban', 'rivaroxaban', 'anticoagulant'], type: 'medication' },
    
    // Procedures and tests
    { patterns: ['ecg', 'electrocardiogram', 'ekg'], type: 'procedure' },
    { patterns: ['x-ray', 'chest x-ray', 'radiograph'], type: 'procedure' },
    { patterns: ['blood test', 'lab work', 'blood draw'], type: 'procedure' },
    { patterns: ['ct scan', 'computed tomography'], type: 'procedure' },
    { patterns: ['mri', 'magnetic resonance imaging'], type: 'procedure' },
    
    // Psychological/Mental health
    { patterns: ['anxiety', 'panic attack', 'worry'], type: 'psychological' },
    { patterns: ['depression', 'sad mood', 'hopelessness'], type: 'psychological' },
    { patterns: ['stress', 'overwhelmed', 'tension'], type: 'psychological' },
    { patterns: ['insomnia', 'sleep disorder', 'can\'t sleep'], type: 'psychological' },
    
    // Lifestyle factors
    { patterns: ['smoking', 'tobacco use', 'cigarettes'], type: 'lifestyle' },
    { patterns: ['alcohol', 'drinking', 'wine', 'beer'], type: 'lifestyle' },
    { patterns: ['exercise', 'physical activity', 'workout'], type: 'lifestyle' },
    { patterns: ['diet', 'nutrition', 'eating habits'], type: 'lifestyle' }
  ];
  
  const textLower = text.toLowerCase();
  
  medicalTerms.forEach(termGroup => {
    termGroup.patterns.forEach(pattern => {
      if (textLower.includes(pattern.toLowerCase())) {
        // Find the actual case used in the text
        const regex = new RegExp(pattern, "gi");
        const matches = text.match(regex);
        
        if (matches) {
          matches.forEach(match => {
            // Calculate confidence based on context and specificity
            let confidence = 0.7;
            
            // Higher confidence for medical terms in medical context
            if (termGroup.type === 'condition' || termGroup.type === 'medication') {
              confidence += 0.2;
            }
            
            // Check for medical context words around the term
            const contextWords = ['patient', 'symptoms', 'diagnosis', 'treatment', 'medical', 'clinical'];
            const hasContext = contextWords.some(word => textLower.includes(word));
            if (hasContext) confidence += 0.1;
            
            confidence = Math.min(confidence, 1.0);
            
            entities.push({
              text: match,
              type: termGroup.type,
              confidence: confidence
            });
          });
        }
      }
    });
  });
  
  // Remove duplicates and sort by confidence
  const uniqueEntities = entities.reduce((acc: NLPEntity[], current) => {
    const existing = acc.find(item => 
      item.text.toLowerCase() === current.text.toLowerCase() && 
      item.type === current.type
    );
    if (!existing) {
      acc.push(current);
    } else if (current.confidence > existing.confidence) {
      existing.confidence = current.confidence;
    }
    return acc;
  }, []);
  
  return uniqueEntities.sort((a, b) => b.confidence - a.confidence);
};

// Real sentiment analysis based on medical language patterns
const analyzeSentiment = (text: string): NLPSentiment => {
  const textLower = text.toLowerCase();
  
  // Medical-specific concern indicators
  const severeIndicators = [
    'severe', 'critical', 'urgent', 'emergency', 'life-threatening', 'acute',
    'deteriorating', 'worsening', 'progressive', 'rapid onset', 'sudden',
    'intractable', 'refractory', 'uncontrolled', 'persistent', 'chronic'
  ];
  
  const moderateIndicators = [
    'concerning', 'notable', 'significant', 'moderate', 'elevated', 'abnormal',
    'irregular', 'intermittent', 'recurrent', 'episodic'
  ];
  
  const positiveIndicators = [
    'improving', 'stable', 'normal', 'good', 'better', 'controlled', 'managed',
    'responsive', 'resolved', 'healing', 'recovery', 'decreased', 'reduced',
    'minimal', 'mild', 'slight', 'tolerable'
  ];
  
  let severityScore = 0;
  let positivityScore = 0;
  let totalIndicators = 0;
  
  // Count severe indicators
  severeIndicators.forEach(indicator => {
    const count = (textLower.match(new RegExp(indicator, 'g')) || []).length;
    severityScore += count * 3;
    totalIndicators += count;
  });
  
  // Count moderate indicators
  moderateIndicators.forEach(indicator => {
    const count = (textLower.match(new RegExp(indicator, 'g')) || []).length;
    severityScore += count * 2;
    totalIndicators += count;
  });
  
  // Count positive indicators
  positiveIndicators.forEach(indicator => {
    const count = (textLower.match(new RegExp(indicator, 'g')) || []).length;
    positivityScore += count * 2;
    totalIndicators += count;
  });
  
  // Calculate sentiment score (-1 to 1)
  let score = 0;
  if (totalIndicators > 0) {
    score = (positivityScore - severityScore) / (totalIndicators * 3);
    score = Math.max(-1, Math.min(1, score));
  }
  
  // Calculate magnitude (strength of sentiment)
  const magnitude = Math.min(1, totalIndicators / 5);
  
  return { score, magnitude };
};

// Real key phrase extraction using medical importance
const extractKeyPhrases = (text: string): string[] => {
  if (!text.trim()) return [];
  
  // Split into sentences and clean them
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // Score sentences based on medical relevance
  const scoredSentences = sentences.map(sentence => {
    const trimmed = sentence.trim();
    let score = 0;
    
    // Medical keywords that increase relevance
    const medicalKeywords = [
      'patient', 'symptoms', 'diagnosis', 'treatment', 'medication', 'condition',
      'blood pressure', 'heart rate', 'pain', 'fever', 'breathing', 'chest',
      'examination', 'assessment', 'findings', 'history', 'presents', 'reports'
    ];
    
    medicalKeywords.forEach(keyword => {
      if (trimmed.toLowerCase().includes(keyword)) {
        score += 1;
      }
    });
    
    // Prefer shorter, more concise sentences
    if (trimmed.length < 100) score += 1;
    if (trimmed.length < 50) score += 1;
    
    // Avoid very long sentences
    if (trimmed.length > 200) score -= 2;
    
    return { sentence: trimmed, score };
  });
  
  // Return top 3 most relevant phrases
  return scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.sentence);
};

// Real diagnosis suggestion based on symptom patterns
const suggestDiagnosis = (text: string): string[] => {
  const textLower = text.toLowerCase();
  const suggestions: string[] = [];
  
  // Medical diagnosis patterns with multiple indicators
  const diagnosisRules = [
    {
      diagnosis: 'Hypertension',
      indicators: [
        /elevated blood pressure|high blood pressure|bp.*1[4-9]\d\/[0-9]\d\d|systolic.*1[4-9]\d|diastolic.*9\d/i,
        /headache.*blood pressure|dizziness.*hypertension/i
      ],
      minMatches: 1
    },
    {
      diagnosis: 'Migraine',
      indicators: [
        /migraine|severe headache/i,
        /headache.*nausea|headache.*vomiting/i,
        /visual.*aura|light sensitivity.*headache/i,
        /throbbing.*head|pulsating.*pain/i
      ],
      minMatches: 1
    },
    {
      diagnosis: 'Type 2 Diabetes',
      indicators: [
        /diabetes|elevated glucose|high blood sugar/i,
        /polyuria|frequent urination/i,
        /polydipsia|excessive thirst/i,
        /fatigue.*weight loss/i
      ],
      minMatches: 1
    },
    {
      diagnosis: 'Coronary Artery Disease',
      indicators: [
        /chest pain|angina|coronary/i,
        /shortness of breath.*exertion/i,
        /crushing.*chest|pressure.*chest/i,
        /left arm pain.*chest/i
      ],
      minMatches: 1
    },
    {
      diagnosis: 'Upper Respiratory Infection',
      indicators: [
        /cough.*fever|productive cough/i,
        /sore throat.*congestion/i,
        /runny nose.*fatigue/i,
        /cold.*symptoms/i
      ],
      minMatches: 1
    },
    {
      diagnosis: 'Anxiety Disorder',
      indicators: [
        /anxiety|panic attack|worried/i,
        /rapid heart rate.*nervousness/i,
        /difficulty sleeping.*stress/i,
        /restless.*overwhelmed/i
      ],
      minMatches: 1
    },
    {
      diagnosis: 'Depression',
      indicators: [
        /depression|depressed mood|sad/i,
        /loss of interest|anhedonia/i,
        /sleep disturbance.*mood/i,
        /fatigue.*hopeless/i
      ],
      minMatches: 1
    },
    {
      diagnosis: 'Gastroesophageal Reflux Disease (GERD)',
      indicators: [
        /heartburn|acid reflux|gerd/i,
        /chest burning.*eating/i,
        /regurgitation.*sour taste/i
      ],
      minMatches: 1
    }
  ];
  
  diagnosisRules.forEach(rule => {
    let matches = 0;
    rule.indicators.forEach(pattern => {
      if (pattern.test(text)) {
        matches++;
      }
    });
    
    if (matches >= rule.minMatches) {
      suggestions.push(rule.diagnosis);
    }
  });
  
  return suggestions;
};

// Real severity assessment based on medical urgency
const assessSeverity = (text: string): number => {
  const textLower = text.toLowerCase();
  let severity = 5; // Start with moderate
  
  // Critical indicators (8-10)
  const criticalWords = [
    'critical', 'life-threatening', 'emergency', 'severe', 'acute',
    'unconscious', 'unresponsive', 'cardiac arrest', 'stroke', 'heart attack',
    'severe bleeding', 'difficulty breathing', 'chest pain', 'sudden onset'
  ];
  
  // High severity indicators (6-7)
  const highSeverityWords = [
    'urgent', 'concerning', 'significant', 'moderate to severe', 'worsening',
    'persistent', 'uncontrolled', 'elevated', 'abnormal', 'irregular'
  ];
  
  // Low severity indicators (1-4)
  const lowSeverityWords = [
    'mild', 'slight', 'minimal', 'stable', 'controlled', 'improving',
    'resolved', 'normal', 'routine', 'follow-up', 'preventive'
  ];
  
  // Calculate severity based on keywords
  criticalWords.forEach(word => {
    if (textLower.includes(word)) {
      severity = Math.max(severity, 8);
    }
  });
  
  highSeverityWords.forEach(word => {
    if (textLower.includes(word)) {
      severity = Math.max(severity, 6);
    }
  });
  
  lowSeverityWords.forEach(word => {
    if (textLower.includes(word)) {
      severity = Math.min(severity, 4);
    }
  });
  
  // Additional context-based adjustments
  if (textLower.includes('pain') && textLower.includes('severe')) {
    severity = Math.max(severity, 7);
  }
  
  if (textLower.includes('blood pressure') && textLower.includes('high')) {
    severity = Math.max(severity, 6);
  }
  
  if (textLower.includes('fever') && textLower.includes('high')) {
    severity = Math.max(severity, 6);
  }
  
  // Vital sign pattern recognition
  const bpPattern = /(\d{3})\/(\d{2,3})/;
  const bpMatch = text.match(bpPattern);
  if (bpMatch) {
    const systolic = parseInt(bpMatch[1]);
    const diastolic = parseInt(bpMatch[2]);
    if (systolic > 180 || diastolic > 110) {
      severity = Math.max(severity, 9);
    } else if (systolic > 160 || diastolic > 100) {
      severity = Math.max(severity, 7);
    }
  }
  
  // Ensure severity is within valid range
  return Math.min(Math.max(severity, 1), 10);
};
