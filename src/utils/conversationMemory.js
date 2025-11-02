/**
 * Conversation memory management for AI Assistant
 * Stores conversation context in localStorage for persistence
 */

const STORAGE_KEY = 'wefix_ai_conversations';

export function saveConversation(sessionId, messages) {
  try {
    const conversations = getConversations();
    conversations[sessionId] = {
      messages: messages.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        timestamp: msg.timestamp?.toISOString() || new Date().toISOString(),
        analysis: msg.analysis ? JSON.stringify(msg.analysis) : null,
        suggestions: msg.suggestions || []
      })),
      lastUpdated: new Date().toISOString()
    };
    
    // Keep only last 10 conversations
    const conversationEntries = Object.entries(conversations)
      .sort((a, b) => new Date(b[1].lastUpdated) - new Date(a[1].lastUpdated))
      .slice(0, 10);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(conversationEntries)));
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

export function getConversations() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error getting conversations:', error);
    return {};
  }
}

export function getConversation(sessionId) {
  const conversations = getConversations();
  const conversation = conversations[sessionId];
  
  if (!conversation) return null;
  
  return {
    messages: conversation.messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
      analysis: msg.analysis ? JSON.parse(msg.analysis) : null
    }))
  };
}

export function createSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function exportConversation(sessionId) {
  const conversation = getConversation(sessionId);
  if (!conversation) return null;
  
  const exportData = {
    sessionId,
    exportedAt: new Date().toISOString(),
    messages: conversation.messages.map(msg => ({
      type: msg.type,
      content: msg.content,
      timestamp: msg.timestamp,
      analysis: msg.analysis
    }))
  };
  
  return JSON.stringify(exportData, null, 2);
}

export function clearConversation(sessionId) {
  try {
    const conversations = getConversations();
    delete conversations[sessionId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Error clearing conversation:', error);
  }
}

