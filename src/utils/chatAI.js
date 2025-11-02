import { analyzeIssue } from './aiClassification';
import { findSimilarIssues } from './similarIssues';
import { extractLocationInfo } from './locationExtractor';

/**
 * Process natural language user messages with enhanced context awareness
 */
export async function processChatMessage(message, conversationHistory = []) {
  const lowerMessage = message.toLowerCase().trim();
  
  // Get context from conversation history
  const recentMessages = conversationHistory.slice(-5);
  const context = extractContext(recentMessages);

  // Greeting detection (enhanced with personalization)
  if (/(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i.test(message)) {
    const greetingTime = getGreetingTime();
    return {
      type: 'text',
      content: `${greetingTime}! I'm WeFix Smart AI, your intelligent civic issue assistant. I can help you report issues, classify problems, analyze images, find similar issues, and answer questions about civic matters. How can I assist you today?`,
      suggestions: [
        "Report a new issue",
        "Analyze an image",
        "What categories can I report?",
        "Find similar issues"
      ]
    };
  }
  
  // Thank you / Appreciation
  if (/(thank|thanks|appreciate|grateful)/i.test(message)) {
    return {
      type: 'text',
      content: "You're welcome! I'm always here to help. Is there anything else you'd like to know or report?",
      suggestions: []
    };
  }
  
  // Goodbye
  if (/(bye|goodbye|see you|later|farewell)/i.test(message)) {
    return {
      type: 'text',
      content: "Goodbye! Feel free to come back anytime you need help with civic issues. Have a great day! 👋",
      suggestions: []
    };
  }
  
  // Find similar issues
  if (/(similar|same|like this|other|related|find|search)/i.test(lowerMessage) && context.hasIssueDescription) {
    return {
      type: 'similar_issues_request',
      action: 'find_similar',
      content: "Let me search for similar issues in our database...",
      userMessage: message,
      previousIssue: context.lastIssueDescription
    };
  }

  // Issue reporting intent
  if (/(report|new issue|submit|problem|complaint)/.test(lowerMessage)) {
    return {
      type: 'action',
      action: 'open_report',
      content: "I can help you report an issue! To get started, please:\n\n1. Describe the issue (e.g., 'There's a water leak on Main Street')\n2. Optionally upload an image\n\nOnce you provide the details, I'll analyze it and predict the category, priority, and other insights automatically.",
      suggestions: ["Describe your issue"]
    };
  }

  // Image analysis intent
  if (/(analyze|classify|check|image|photo|picture|upload)/.test(lowerMessage)) {
    return {
      type: 'action',
      action: 'upload_image',
      content: "I can analyze images to classify issues! Please upload an image of the problem, and I'll:\n\n• Identify the issue category\n• Estimate priority level\n• Detect urgency indicators\n• Check for spam",
      suggestions: ["Upload an image"]
    };
  }

  // Category questions
  if (/(category|categories|types|kinds|what can)/.test(lowerMessage)) {
    return {
      type: 'text',
      content: "I can classify issues into these categories:\n\n🏷️ **Water Clogging** - Leaks, floods, drainage issues\n🏷️ **Road Damage** - Potholes, cracks, surface problems\n🏷️ **Garbage** - Trash, waste, litter problems\n🏷️ **Streetlight** - Broken lights, dark areas\n🏷️ **Public Safety** - Hazards, dangerous conditions\n🏷️ **Traffic Issue** - Congestion, parking problems\n🏷️ **Environmental** - Pollution, tree issues\n\nJust describe your issue and I'll automatically classify it!",
      suggestions: []
    };
  }

  // Priority questions
  if (/(priority|urgent|important|high|medium|low)/.test(lowerMessage)) {
    return {
      type: 'text',
      content: "I analyze priority based on multiple factors:\n\n🔴 **High Priority**: Emergency keywords, public safety issues, severe problems\n🟠 **Medium Priority**: Standard issues needing attention\n🟡 **Low Priority**: Minor cosmetic issues\n\nFactors I consider:\n• Urgent keywords (emergency, danger, etc.)\n• Issue category (Public Safety = higher priority)\n• Sentiment analysis (negative tone = higher priority)\n• Image classification results\n\nWould you like me to analyze a specific issue?",
      suggestions: ["Describe an issue to analyze"]
    };
  }

  // Help/Commands
  if (/(help|commands|what can you|features|capabilities)/.test(lowerMessage)) {
    return {
      type: 'text',
      content: "I'm WeFix Smart AI, your civic issue assistant! Here's what I can do:\n\n✨ **Text Classification** - Detect issue category from descriptions\n📷 **Image Analysis** - Classify issues from photos\n⚡ **Priority Scoring** - Estimate urgency (High/Medium/Low)\n💬 **Sentiment Analysis** - Detect tone and urgency\n🚫 **Spam Detection** - Filter irrelevant reports\n\n**How to use me:**\n• Describe an issue → I'll classify it\n• Upload an image → I'll analyze it\n• Ask questions → I'll explain features\n• Say 'report issue' → I'll guide you through reporting",
      suggestions: [
        "How to report an issue?",
        "Analyze an image",
        "What categories exist?"
      ]
    };
  }

  // Issue description detection - enhanced with better keyword detection
  const issueKeywords = [
    'water', 'leak', 'flood', 'drainage', 'sewage', 'puddle',
    'pothole', 'road', 'street', 'asphalt', 'crack', 'bump',
    'garbage', 'trash', 'waste', 'litter', 'dump', 'rubbish',
    'light', 'streetlight', 'lamp', 'bulb', 'dark', 'broken light',
    'danger', 'hazard', 'unsafe', 'emergency', 'accident', 'risk',
    'traffic', 'congestion', 'parking', 'vehicle', 'roadblock',
    'tree', 'pollution', 'environment', 'broken', 'damage', 'problem', 'issue'
  ];
  
  const hasIssueKeywords = issueKeywords.some(keyword => lowerMessage.includes(keyword));
  const hasIssueStructure = /(there is|there's|i see|i notice|found|discovered|problem with|issue with)/i.test(message);
  
  if ((hasIssueKeywords || hasIssueStructure) && message.length > 10) {
    // This looks like an issue description - analyze it
    return {
      type: 'analysis_request',
      action: 'analyze_text',
      content: "I see you've described an issue. Let me analyze it for category, priority, and provide insights...",
      userMessage: message
    };
  }
  
  // Statistics/Status queries
  if (/(how many|statistics|stats|count|number of|status)/i.test(lowerMessage)) {
    return {
      type: 'stats_request',
      action: 'get_stats',
      content: "I can provide you with platform statistics. Let me fetch the latest data...",
      suggestions: []
    };
  }

  // Default response with better context awareness
  const defaultMessage = context.hasPreviousInteraction 
    ? "I'm here to help you with civic issues. You can describe an issue, upload an image, ask questions, or search for similar issues. What would you like to do?"
    : "I understand you want help with civic issues. I can:\n\n• Analyze issue descriptions and images\n• Classify issues into categories\n• Estimate priority levels\n• Find similar issues in the database\n• Detect sentiment and spam\n• Help you report issues\n\nYou can describe an issue, upload an image, or ask me questions. What would you like to do?";
  
  return {
    type: 'text',
    content: defaultMessage,
    suggestions: [
      "Report a new issue",
      "Analyze an image",
      "Find similar issues",
      "Explain categories",
      "How does priority work?"
    ]
  };
}

/**
 * Extract context from conversation history
 */
function extractContext(messages) {
  const context = {
    hasIssueDescription: false,
    lastIssueDescription: null,
    hasPreviousInteraction: messages.length > 1,
    mentionedCategories: [],
    mentionedLocations: []
  };
  
  messages.forEach(msg => {
    if (msg.type === 'user') {
      const lowerMsg = msg.content.toLowerCase();
      const issueKeywords = ['water', 'leak', 'pothole', 'garbage', 'light', 'broken', 'damage', 'problem'];
      if (issueKeywords.some(kw => lowerMsg.includes(kw)) && msg.content.length > 15) {
        context.hasIssueDescription = true;
        context.lastIssueDescription = msg.content;
      }
    }
  });
  
  return context;
}

/**
 * Get time-appropriate greeting
 */
function getGreetingTime() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Analyze user's issue description with enhanced insights
 */
export async function analyzeUserIssue(text, imageFile = null, includeSimilar = true) {
  try {
    const analysis = await analyzeIssue(text, imageFile);
    
    // Try to extract location information
    const locationInfo = await extractLocationInfo(text).catch(() => null);
    
    // Find similar issues if requested
    let similarIssues = [];
    if (includeSimilar && text.length > 10) {
      similarIssues = await findSimilarIssues(text, 3).catch(() => []);
    }
    
    let response = `## Analysis Complete\n\n`;
    
    if (analysis.textAnalysis) {
      response += `**Category**: ${analysis.textAnalysis.category} (${(analysis.textAnalysis.confidence * 100).toFixed(0)}% confidence)\n\n`;
    }
    
    if (analysis.imageAnalysis) {
      response += `**Image Classification**: ${analysis.imageAnalysis.category} (${(analysis.imageAnalysis.confidence * 100).toFixed(0)}% confidence)\n\n`;
    }
    
    if (analysis.priority) {
      const priorityEmoji = analysis.priority.priority === 'High' ? '🔴' : 
                           analysis.priority.priority === 'Medium' ? '🟠' : '🟡';
      response += `**Priority**: ${priorityEmoji} ${analysis.priority.priority}\n`;
      response += `**Reasoning**: ${analysis.priority.reasoning}\n\n`;
    }
    
    if (analysis.sentiment) {
      const sentimentEmoji = analysis.sentiment.sentiment === 'negative' ? '😟' :
                            analysis.sentiment.sentiment === 'positive' ? '😊' : '😐';
      response += `**Sentiment**: ${sentimentEmoji} ${analysis.sentiment.sentiment}\n\n`;
    }
    
    if (locationInfo && locationInfo.source === 'text') {
      response += `**Location Detected**: ${locationInfo.locationText}\n`;
      if (locationInfo.displayName) {
        response += `**Address**: ${locationInfo.displayName}\n\n`;
      }
    }
    
    if (analysis.spam?.isSpam) {
      response += `⚠️ **Warning**: Potential spam detected - ${analysis.spam.reason}\n\n`;
    }
    
    if (similarIssues.length > 0) {
      response += `\n**Similar Issues Found** (${similarIssues.length}):\n\n`;
      similarIssues.slice(0, 3).forEach((issue, idx) => {
        response += `${idx + 1}. ${issue.title} (${issue.status})\n`;
      });
      response += `\n`;
    }
    
    response += `Would you like me to save this issue to the database?`;
    
    return {
      type: 'analysis_result',
      content: response,
      analysis: analysis,
      locationInfo: locationInfo,
      similarIssues: similarIssues,
      suggestions: ['Save this issue', 'Show similar issues', 'Analyze another issue']
    };
  } catch (error) {
    console.error('Analysis error:', error);
    return {
      type: 'error',
      content: "I encountered an error while analyzing. Please try again or describe the issue differently."
    };
  }
}

/**
 * Process similar issues request
 */
export async function processSimilarIssuesRequest(text) {
  try {
    const similarIssues = await findSimilarIssues(text, 5);
    
    if (similarIssues.length === 0) {
      return {
        type: 'text',
        content: "I couldn't find any similar issues in our database. This might be a unique issue, which makes it even more important to report!",
        suggestions: ['Save this issue', 'Describe another issue']
      };
    }
    
    let response = `I found ${similarIssues.length} similar issue(s):\n\n`;
    
    similarIssues.forEach((issue, idx) => {
      const statusBadge = issue.status === 'Resolved' ? '✅' : 
                         issue.status === 'In-Progress' ? '🔄' : '⏳';
      response += `${idx + 1}. ${statusBadge} **${issue.title}**\n`;
      response += `   Status: ${issue.status} | Category: ${issue.ai_category || 'Unknown'}\n`;
      if (issue.description) {
        response += `   ${issue.description.substring(0, 80)}${issue.description.length > 80 ? '...' : ''}\n`;
      }
      response += `\n`;
    });
    
    response += `Would you like to see more details about any of these issues, or save your new issue?`;
    
    return {
      type: 'similar_issues_result',
      content: response,
      similarIssues: similarIssues,
      suggestions: ['Save my issue', 'Show more details']
    };
  } catch (error) {
    console.error('Error finding similar issues:', error);
    return {
      type: 'error',
      content: "I encountered an error while searching for similar issues. Please try again."
    };
  }
}


