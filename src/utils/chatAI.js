import { analyzeIssue } from './aiClassification';

/**
 * Process natural language user messages and provide AI responses
 */
export function processChatMessage(message, conversationHistory = []) {
  const lowerMessage = message.toLowerCase().trim();

  // Greeting detection
  if (/(hi|hello|hey|greetings)/.test(lowerMessage)) {
    return {
      type: 'text',
      content: "Hello! I'm WeFix Smart AI. I can help you report issues, classify problems, analyze images, and answer questions about civic issues. How can I assist you today?",
      suggestions: [
        "Report a new issue",
        "Analyze an image",
        "What categories can I report?",
        "How does priority work?"
      ]
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

  // Issue description detection - try to analyze it
  const issueKeywords = ['water', 'leak', 'pothole', 'road', 'garbage', 'trash', 'light', 'broken', 'damage', 'problem', 'issue'];
  if (issueKeywords.some(keyword => lowerMessage.includes(keyword)) && lowerMessage.length > 10) {
    // This looks like an issue description - analyze it
    return {
      type: 'analysis_request',
      action: 'analyze_text',
      content: "I see you've described an issue. Let me analyze it...",
      userMessage: message
    };
  }

  // Default response
  return {
    type: 'text',
    content: "I understand you want help with civic issues. I can:\n\n• Analyze issue descriptions and images\n• Classify issues into categories\n• Estimate priority levels\n• Detect sentiment and spam\n• Help you report issues\n\nYou can describe an issue, upload an image, or ask me questions. What would you like to do?",
    suggestions: [
      "Report a new issue",
      "Analyze an image",
      "Explain categories",
      "How does priority work?"
    ]
  };
}

/**
 * Analyze user's issue description
 */
export async function analyzeUserIssue(text, imageFile = null) {
  try {
    const analysis = await analyzeIssue(text, imageFile);
    
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
      response += `**Sentiment**: ${analysis.sentiment.sentiment}\n\n`;
    }
    
    if (analysis.spam?.isSpam) {
      response += `⚠️ **Warning**: Potential spam detected - ${analysis.spam.reason}\n\n`;
    }
    
    response += `Would you like me to save this issue to the database?`;
    
    return {
      type: 'analysis_result',
      content: response,
      analysis: analysis,
      suggestions: ['Save this issue', 'Analyze another issue']
    };
  } catch (error) {
    console.error('Analysis error:', error);
    return {
      type: 'error',
      content: "I encountered an error while analyzing. Please try again or describe the issue differently."
    };
  }
}

