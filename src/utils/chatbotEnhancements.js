/**
 * Additional chatbot enhancements and utilities
 */

/**
 * Generate smart suggestions based on conversation context
 */
export function generateSmartSuggestions(messages, userInput) {
  const suggestions = [];
  const lowerInput = userInput.toLowerCase();
  const recentContext = messages.slice(-3).map(m => m.content?.toLowerCase() || '').join(' ');
  
  // Issue reporting suggestions
  if (lowerInput.includes('report') || lowerInput.includes('issue') || lowerInput.includes('problem')) {
    suggestions.push("Show me how to report an issue");
    suggestions.push("What categories of issues can I report?");
    suggestions.push("Find similar issues in my area");
  }
  
  // Category-related suggestions
  if (lowerInput.includes('category') || lowerInput.includes('type')) {
    suggestions.push("Report a water clogging issue");
    suggestions.push("Report road damage");
    suggestions.push("Report garbage problems");
  }
  
  // Location-related suggestions
  if (lowerInput.includes('location') || lowerInput.includes('where') || lowerInput.includes('near')) {
    suggestions.push("Use my current location");
    suggestions.push("Search for issues near me");
  }
  
  // Image-related suggestions
  if (recentContext.includes('image') || recentContext.includes('photo') || recentContext.includes('picture')) {
    suggestions.push("Analyze this image");
    suggestions.push("How does image analysis work?");
  }
  
  // Default suggestions if no specific context
  if (suggestions.length === 0) {
    suggestions.push("Report a new issue");
    suggestions.push("Show me platform statistics");
    suggestions.push("Find similar issues");
    suggestions.push("Explain how priority works");
  }
  
  return suggestions.slice(0, 4); // Return top 4 suggestions
}

/**
 * Detect user intent more accurately
 */
export function detectIntent(message) {
  const lowerMessage = message.toLowerCase();
  
  const intents = {
    report: /(report|submit|new issue|problem|complaint|issue)/i.test(lowerMessage),
    analyze: /(analyze|classify|check|predict|what is)/i.test(lowerMessage),
    search: /(find|search|look for|show me|similar|related)/i.test(lowerMessage),
    help: /(help|how|what can|features|capabilities|guide)/i.test(lowerMessage),
    stats: /(statistics|stats|how many|count|number|total)/i.test(lowerMessage),
    location: /(location|where|near|address|place)/i.test(lowerMessage),
    image: /(image|photo|picture|upload|photo)/i.test(lowerMessage),
    priority: /(priority|urgent|important|emergency|critical)/i.test(lowerMessage),
    category: /(category|categories|type|types|kind|kinds)/i.test(lowerMessage)
  };
  
  // Return primary intent
  for (const [intent, detected] of Object.entries(intents)) {
    if (detected) return intent;
  }
  
  return 'general';
}

/**
 * Generate contextual help based on intent
 */
export function getContextualHelp(intent, conversationHistory = []) {
  const helpMessages = {
    report: "I can help you report an issue! Just describe what you see or upload an image. I'll automatically classify it and suggest the best category.",
    analyze: "I can analyze issue descriptions and images to predict category, priority, sentiment, and detect spam. Just describe or show me the issue!",
    search: "I can search for similar issues in our database. Describe an issue and I'll find related problems that have been reported.",
    help: "I'm here to help with civic issues! I can:\n• Analyze and classify issues\n• Find similar problems\n• Provide platform statistics\n• Guide you through reporting\nWhat would you like to do?",
    stats: "I can show you platform statistics including total issues, resolved count, active groups, and fundraising progress. Just ask!",
    location: "I can detect locations from your text descriptions or use your browser's geolocation. I'll automatically extract and geocode location information.",
    image: "Upload an image and I'll analyze it to classify the issue type. I can also extract location information from images if available.",
    priority: "I analyze priority based on:\n• Urgent keywords (emergency, danger, etc.)\n• Issue category (Public Safety = higher)\n• Sentiment analysis\n• Image classification",
    category: "I classify issues into:\n🏷️ Water Clogging\n🏷️ Road Damage\n🏷️ Garbage\n🏷️ Streetlight\n🏷️ Public Safety\n🏷️ Traffic Issue\n🏷️ Environmental\n🏷️ Other",
    general: "I'm WeFix Smart AI! I can help you report issues, analyze problems, find similar issues, and answer questions. What would you like to do?"
  };
  
  return helpMessages[intent] || helpMessages.general;
}

/**
 * Format response for better readability
 */
export function formatResponse(text) {
  // Add spacing between sections
  text = text.replace(/\n\n\n+/g, '\n\n');
  
  // Ensure proper markdown formatting
  text = text.replace(/\*\*([^*]+)\*\*/g, '**$1**');
  
  return text;
}

