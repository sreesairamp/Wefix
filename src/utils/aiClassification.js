import * as tf from '@tensorflow/tfjs';

// Text classification categories
const ISSUE_CATEGORIES = {
  'Water Clogging': ['water', 'flood', 'leak', 'drainage', 'sewage', 'overflow', 'puddle', 'waterlogged'],
  'Road Damage': ['pothole', 'road', 'asphalt', 'crack', 'surface', 'bump', 'broken road', 'damaged'],
  'Garbage': ['garbage', 'trash', 'waste', 'litter', 'dump', 'rubbish', 'refuse', 'debris'],
  'Streetlight': ['light', 'lamp', 'streetlight', 'bulb', 'dark', 'illumination', 'broken light'],
  'Public Safety': ['danger', 'unsafe', 'hazard', 'emergency', 'accident', 'risk', 'safety'],
  'Traffic Issue': ['traffic', 'congestion', 'parking', 'vehicle', 'roadblock', 'jam'],
  'Environmental': ['tree', 'pollution', 'air', 'noise', 'environment', 'green'],
  'Other': []
};

// Priority keywords
const PRIORITY_KEYWORDS = {
  high: ['emergency', 'urgent', 'danger', 'hazard', 'accident', 'critical', 'immediate', 'broken', 'severe', 'blocked'],
  medium: ['issue', 'problem', 'needs', 'should', 'concern', 'affecting'],
  low: ['minor', 'small', 'slight', 'cosmetic', 'when possible']
};

// Sentiment analysis keywords
const SENTIMENT_KEYWORDS = {
  positive: ['great', 'good', 'excellent', 'thank', 'appreciate', 'helpful', 'solved', 'fixed'],
  negative: ['terrible', 'awful', 'bad', 'horrible', 'disappointed', 'frustrated', 'angry', 'broken', 'failed'],
  neutral: []
};

/**
 * Classify issue category from text
 */
export function classifyTextCategory(text) {
  if (!text || typeof text !== 'string') {
    return { category: 'Other', confidence: 0 };
  }

  const lowerText = text.toLowerCase();
  let maxScore = 0;
  let bestCategory = 'Other';
  const scores = {};

  // Count keyword matches for each category
  Object.keys(ISSUE_CATEGORIES).forEach(category => {
    if (category === 'Other') return;
    
    const keywords = ISSUE_CATEGORIES[category];
    const score = keywords.reduce((acc, keyword) => {
      return acc + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);
    
    scores[category] = score;
    
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  });

  const confidence = maxScore > 0 ? Math.min(maxScore / 3, 1) : 0.1;

  return {
    category: bestCategory,
    confidence: parseFloat(confidence.toFixed(2)),
    scores
  };
}

/**
 * Analyze sentiment from text
 */
export function analyzeSentiment(text) {
  if (!text || typeof text !== 'string') {
    return { sentiment: 'neutral', confidence: 0 };
  }

  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  SENTIMENT_KEYWORDS.positive.forEach(keyword => {
    if (lowerText.includes(keyword)) positiveCount++;
  });

  SENTIMENT_KEYWORDS.negative.forEach(keyword => {
    if (lowerText.includes(keyword)) negativeCount++;
  });

  let sentiment = 'neutral';
  let confidence = 0;

  if (positiveCount > negativeCount && positiveCount > 0) {
    sentiment = 'positive';
    confidence = Math.min(positiveCount / 5, 1);
  } else if (negativeCount > positiveCount && negativeCount > 0) {
    sentiment = 'negative';
    confidence = Math.min(negativeCount / 5, 1);
  } else {
    sentiment = 'neutral';
    confidence = 0.5;
  }

  return {
    sentiment,
    confidence: parseFloat(confidence.toFixed(2))
  };
}

/**
 * Calculate priority score based on text, category, and sentiment
 */
export function calculatePriority(text, category, sentiment, imageClass = null) {
  const lowerText = (text || '').toLowerCase();
  let priorityScore = 0;

  // High priority indicators
  PRIORITY_KEYWORDS.high.forEach(keyword => {
    if (lowerText.includes(keyword)) priorityScore += 3;
  });

  // Medium priority indicators
  PRIORITY_KEYWORDS.medium.forEach(keyword => {
    if (lowerText.includes(keyword)) priorityScore += 1;
  });

  // Category-based priority
  const highPriorityCategories = ['Public Safety', 'Water Clogging', 'Road Damage'];
  if (highPriorityCategories.includes(category)) {
    priorityScore += 2;
  }

  // Sentiment-based priority (negative sentiment = higher priority)
  if (sentiment === 'negative') {
    priorityScore += 2;
  } else if (sentiment === 'positive') {
    priorityScore -= 1;
  }

  // Image classification boost (if available)
  if (imageClass) {
    const highPriorityClasses = ['urgent', 'danger', 'critical'];
    if (highPriorityClasses.some(c => imageClass.toLowerCase().includes(c))) {
      priorityScore += 3;
    }
  }

  // Determine priority level
  let priority = 'Low';
  if (priorityScore >= 5) {
    priority = 'High';
  } else if (priorityScore >= 2) {
    priority = 'Medium';
  }

  return {
    priority,
    score: priorityScore,
    reasoning: generatePriorityReasoning(priorityScore, category, sentiment)
  };
}

function generatePriorityReasoning(score, category, sentiment) {
  const reasons = [];
  
  if (score >= 5) {
    reasons.push('Contains urgent keywords');
  }
  if (['Public Safety', 'Water Clogging', 'Road Damage'].includes(category)) {
    reasons.push(`Critical category: ${category}`);
  }
  if (sentiment === 'negative') {
    reasons.push('Negative sentiment indicates urgency');
  }
  
  return reasons.join(', ') || 'Based on standard assessment';
}

/**
 * Detect potential spam
 */
export function detectSpam(text) {
  if (!text || typeof text !== 'string') {
    return { isSpam: false, confidence: 0 };
  }

  const lowerText = text.toLowerCase();
  
  // Spam indicators
  const spamPatterns = [
    /http[s]?:\/\//, // URLs
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/, // Email addresses
    /(buy|sell|cheap|discount|offer|deal).*now/gi, // Commercial keywords
    /(click|visit|call).*(now|today)/gi,
  ];

  // Check for very short descriptions
  if (text.trim().length < 10) {
    return { isSpam: true, confidence: 0.7, reason: 'Description too short' };
  }

  // Check for repeated characters (spammy patterns)
  if (/(.)\1{5,}/.test(text)) {
    return { isSpam: true, confidence: 0.8, reason: 'Repeated characters detected' };
  }

  // Check for spam patterns
  for (const pattern of spamPatterns) {
    if (pattern.test(lowerText)) {
      return { isSpam: true, confidence: 0.9, reason: 'Spam pattern detected' };
    }
  }

  return { isSpam: false, confidence: 0.1 };
}

/**
 * Load and classify image using TensorFlow.js model
 */
export async function classifyImage(imageFile) {
  try {
    // Check if model files exist
    // Try multiple possible paths
    const possiblePaths = [
      '/model/model.json',
      './model/model.json',
      '/public/model/model.json'
    ];
    
    let modelPath = possiblePaths[0];
    
    // Try to load the model from multiple paths
    let model;
    let lastError;
    
    for (const path of possiblePaths) {
      try {
        model = await tf.loadLayersModel(path);
        modelPath = path;
        break;
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    
    if (!model) {
      console.warn('Model file not found at any path, using fallback classification', lastError);
      // Fallback: classify based on image metadata
      return classifyImageFallback(imageFile);
    }

    // Preprocess image
    const image = await loadImage(imageFile);
    const tensor = preprocessImage(image);

    // Make prediction
    const prediction = model.predict(tensor);
    const predictionData = await prediction.data();
    
    // Clean up tensors to prevent memory leaks
    tensor.dispose();
    prediction.dispose();
    
    // Get class names - adjust these based on your actual model output
    // Default classes for 4-class model from the provided JSON
    // Your model outputs 4 classes: [0, 1, 2, 3] with softmax activation
    const classes = ['Water Clogging', 'Road Damage', 'Garbage', 'Streetlight'];
    const predictionArray = Array.from(predictionData);
    const maxIndex = predictionArray.indexOf(Math.max(...predictionArray));
    const confidence = predictionArray[maxIndex];

    return {
      category: classes[maxIndex] || 'Other',
      confidence: parseFloat(confidence.toFixed(2)),
      allPredictions: predictionArray.map((prob, idx) => ({
        class: classes[idx] || 'Other',
        probability: parseFloat(prob.toFixed(2))
      }))
    };
  } catch (error) {
    console.error('Image classification error:', error);
    return classifyImageFallback(imageFile);
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      // Don't revoke URL yet - image might still be needed
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
    img.src = objectUrl;
  });
}

function preprocessImage(image) {
  // Resize to 224x224 (adjust based on your model input size)
  return tf.browser.fromPixels(image)
    .resizeNearestNeighbor([224, 224])
    .expandDims(0)
    .div(255.0);
}

function classifyImageFallback(imageFile) {
  // Fallback classification based on file name or basic analysis
  return {
    category: 'Other',
    confidence: 0.5,
    allPredictions: [],
    note: 'Using fallback classification'
  };
}

/**
 * Combined AI analysis
 */
export async function analyzeIssue(text, imageFile = null) {
  const results = {
    textAnalysis: null,
    imageAnalysis: null,
    sentiment: null,
    priority: null,
    spam: null,
    timestamp: new Date().toISOString()
  };

  // Text classification
  if (text) {
    results.textAnalysis = classifyTextCategory(text);
    results.sentiment = analyzeSentiment(text);
    results.spam = detectSpam(text);
  }

  // Image classification
  if (imageFile) {
    results.imageAnalysis = await classifyImage(imageFile);
  }

  // Priority calculation
  const finalCategory = results.imageAnalysis?.category || results.textAnalysis?.category || 'Other';
  results.priority = calculatePriority(
    text,
    finalCategory,
    results.sentiment?.sentiment || 'neutral',
    results.imageAnalysis?.category
  );

  return results;
}

