import { useState, useRef, useEffect } from 'react';
import { processChatMessage, analyzeUserIssue, processSimilarIssuesRequest } from '../utils/chatAI';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { saveConversation, createSessionId, exportConversation, clearConversation, getConversation } from '../utils/conversationMemory';
import { renderMarkdown } from '../utils/markdownRenderer';
import { getPlatformStats } from '../utils/getStats';
import { generateSmartSuggestions, detectIntent, getContextualHelp } from '../utils/chatbotEnhancements';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => createSessionId());
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm WeFix Smart AI. I can help you report issues, analyze images, classify problems, find similar issues, and answer questions about civic issues. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingImagePreview, setPendingImagePreview] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [locationInfo, setLocationInfo] = useState(null);
  const [similarIssues, setSimilarIssues] = useState([]);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save conversation to memory
  useEffect(() => {
    if (messages.length > 1) {
      saveConversation(sessionId, messages);
    }
  }, [messages, sessionId]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Initialize speech recognition if available
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const addMessage = (type, content, analysis = null, locationInfo = null, similarIssues = null, suggestions = null) => {
    const messageObj = typeof content === 'string' ? { content } : content;
    const newMessage = {
      id: Date.now(),
      type,
      content: typeof content === 'string' ? content : messageObj.content || content,
      analysis,
      locationInfo,
      similarIssues,
      timestamp: new Date(),
      suggestions: suggestions || messageObj.suggestions || []
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const simulateTyping = (callback, delay = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !pendingImage) return;

    const userMessage = inputValue.trim();
    
    // Add user message
    if (userMessage || pendingImage) {
      const messageContent = pendingImage 
        ? (userMessage ? `${userMessage}\n[Image: ${pendingImage.name}]` : `[Image uploaded: ${pendingImage.name}]`)
        : userMessage;
      
      const newMessage = addMessage('user', messageContent);
      if (pendingImagePreview) {
        newMessage.imagePreview = pendingImagePreview;
      }
    }

    const messageToSend = userMessage;
    setInputValue('');
    setIsTyping(true);

    try {
      // Process as chat message first to determine intent
      const response = await processChatMessage(messageToSend, messages);
      
      if (response.type === 'analysis_request') {
        // Analyze issue
        simulateTyping(async () => {
          const analysisResult = await analyzeUserIssue(messageToSend || 'Issue detected from image', pendingImage);
          setLocationInfo(analysisResult.locationInfo || null);
          setSimilarIssues(analysisResult.similarIssues || []);
          addMessage('ai', analysisResult.content, analysisResult.analysis, analysisResult.locationInfo, analysisResult.similarIssues, analysisResult.suggestions);
          setPendingImage(null);
          setPendingImagePreview(null);
          setIsTyping(false);
        }, 1200);
      } else if (response.type === 'similar_issues_request') {
        // Find similar issues
        simulateTyping(async () => {
          const similarResult = await processSimilarIssuesRequest(response.previousIssue || messageToSend);
          setSimilarIssues(similarResult.similarIssues || []);
          addMessage('ai', similarResult.content, null, null, similarResult.similarIssues, similarResult.suggestions);
          setIsTyping(false);
        }, 1500);
      } else if (response.type === 'stats_request') {
        // Get platform statistics
        simulateTyping(async () => {
          const stats = await getPlatformStats();
          const statsMessage = `Here are the current platform statistics:\n\n` +
            `📊 **Total Issues**: ${stats.totalIssues}\n` +
            `✅ **Resolved**: ${stats.resolvedIssues}\n` +
            `👥 **Total Users**: ${stats.totalUsers}\n` +
            `🏘️ **Active Groups**: ${stats.totalGroups}\n` +
            `💰 **Active Fundraisers**: ${stats.activeFundraisers}\n` +
            `💵 **Total Donations**: $${stats.totalDonations.toFixed(2)}\n\n` +
            `Great job everyone! Keep reporting and fixing issues! 🎉`;
          addMessage('ai', statsMessage);
          setIsTyping(false);
        }, 1000);
      } else {
        // Regular chat response - enhance with smart suggestions if none provided
        const suggestions = response.suggestions && response.suggestions.length > 0 
          ? response.suggestions 
          : generateSmartSuggestions(messages, messageToSend);
        
        simulateTyping(() => {
          addMessage('ai', response.content, null, null, null, suggestions);
          if (pendingImage) {
            setPendingImage(null);
            setPendingImagePreview(null);
          }
          setIsTyping(false);
        }, 800);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      addMessage('ai', "I encountered an error. Please try again.");
    }
  };

  const handleAnalyzeIssue = async (text, imageFile) => {
    try {
      const analysisResult = await analyzeUserIssue(text, imageFile);
      setLocationInfo(analysisResult.locationInfo || null);
      setSimilarIssues(analysisResult.similarIssues || []);
      addMessage('ai', analysisResult.content, analysisResult.analysis, analysisResult.locationInfo, analysisResult.similarIssues, analysisResult.suggestions);
      setPendingImage(null);
      setPendingImagePreview(null);
    } catch (error) {
      console.error('Analysis error:', error);
      addMessage('ai', "I encountered an error while analyzing. Please try again.");
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      addMessage('ai', "Sorry, voice input is not supported in your browser.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleExportConversation = () => {
    const exportData = exportConversation(sessionId);
    if (!exportData) {
      addMessage('ai', "No conversation to export.");
      return;
    }
    
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wefix-conversation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addMessage('ai', "Conversation exported successfully! 📥");
  };

  const handleClearConversation = () => {
    clearConversation(sessionId);
    setMessages([{
      id: 1,
      type: 'ai',
      content: "Hello! I'm WeFix Smart AI. I can help you report issues, analyze images, classify problems, find similar issues, and answer questions about civic issues. How can I assist you today?",
      timestamp: new Date()
    }]);
    setLocationInfo(null);
    setSimilarIssues([]);
    addMessage('ai', "Conversation cleared. How can I help you?");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPendingImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSaveIssue = async (analysis) => {
    if (!user) {
      addMessage('ai', "Please login to save issues. You can use the login button in the navigation bar.");
      return;
    }

    if (!analysis) {
      addMessage('ai', "I need to analyze an issue first. Please describe an issue or upload an image.");
      return;
    }

    setIsTyping(true);

    try {
      let imageUrl = null;

      // Upload image if available
      if (pendingImage) {
        const fileExt = pendingImage.name.split('.').pop();
        const fileName = `ai-issue-${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('issue-images')
          .upload(filePath, pendingImage);

        if (!uploadError) {
          const { data: publicUrl } = supabase.storage
            .from('issue-images')
            .getPublicUrl(filePath);
          imageUrl = publicUrl.publicUrl;
        }
      }

      // Find the user's description from messages
      const userDescription = messages
        .filter(m => m.type === 'user')
        .slice(-1)[0]?.content || 'AI-detected issue';

      const category = analysis.imageAnalysis?.category || 
                       analysis.textAnalysis?.category || 
                       'Other';

      // Get location from the last message or default
      const lastAIMessage = messages.filter(m => m.type === 'ai').slice(-1)[0];
      const issueLocationInfo = lastAIMessage?.locationInfo || locationInfo;

      const { error } = await supabase.from('issues').insert([{
        title: userDescription.substring(0, 100) || 'AI Detected Issue',
        description: userDescription.length > 100 ? userDescription : userDescription,
        image_url: imageUrl,
        status: 'Open',
        user_id: user.id,
        ai_category: category,
        ai_priority: analysis.priority?.priority || 'Medium',
        ai_confidence: analysis.textAnalysis?.confidence || 0.5,
        ai_sentiment: analysis.sentiment?.sentiment || 'neutral',
        ai_spam_detected: analysis.spam?.isSpam || false,
        latitude: issueLocationInfo?.lat || 17.385,
        longitude: issueLocationInfo?.lng || 78.4867,
      }]);

      if (error) {
        addMessage('ai', `Failed to save issue: ${error.message}`);
      } else {
        addMessage('ai', "✅ Issue saved successfully! You can view it on the Issues page.");
      }
    } catch (error) {
      console.error('Save error:', error);
      addMessage('ai', "Failed to save issue. Please try again.");
    } finally {
      setIsTyping(false);
      setPendingImage(null);
      setPendingImagePreview(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-brand to-brand-accent text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center group animate-bounce"
          aria-label="Open WeFix Smart AI"
        >
          <svg className="w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat Interface - ChatGPT/Swiggy Style */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border-2 border-brand/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand to-brand-accent text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">WeFix Smart AI</h3>
                <p className="text-xs text-brand-light flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Always here to help
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportConversation}
                className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded"
                title="Export conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button
                onClick={handleClearConversation}
                className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded"
                title="Clear conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                }}
                className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand to-brand-accent flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-brand to-brand-accent text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-200 rounded-bl-sm'
                  }`}
                >
                  {message.type === 'user' && message.imagePreview && (
                    <img 
                      src={message.imagePreview} 
                      alt="Uploaded" 
                      className="max-w-full max-h-48 rounded-lg mb-2 object-cover border border-gray-200" 
                    />
                  )}
                  
                  <div 
                    className="whitespace-pre-wrap break-words text-sm leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: message.type === 'ai' ? renderMarkdown(message.content) : message.content.replace(/\n/g, '<br />') }}
                  />
                  
                  {/* Location Info Display */}
                  {message.locationInfo && message.locationInfo.source === 'text' && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      <div className="flex items-start gap-2 text-xs">
                        <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-gray-700">Location Detected:</p>
                          <p className="text-gray-600">{message.locationInfo.locationText}</p>
                          {message.locationInfo.displayName && (
                            <p className="text-gray-500 italic mt-1">{message.locationInfo.displayName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Similar Issues Display */}
                  {message.similarIssues && message.similarIssues.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Similar Issues:</p>
                      <div className="space-y-2">
                        {message.similarIssues.slice(0, 3).map((issue, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-2 text-xs">
                            <p className="font-medium text-gray-800 truncate">{issue.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                issue.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                issue.status === 'In-Progress' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {issue.status}
                              </span>
                              <span className="text-gray-500">{issue.ai_category}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {message.analysis && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      <button
                        onClick={() => handleSaveIssue(message.analysis)}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save Issue to Database
                      </button>
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs transition-colors border border-gray-200"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-brand to-brand-accent flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview */}
          {pendingImagePreview && (
            <div className="px-4 pt-2 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                <img src={pendingImagePreview} alt="Preview" className="w-12 h-12 rounded object-cover" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700">{pendingImage?.name}</p>
                  <p className="text-xs text-gray-500">Ready to analyze</p>
                </div>
                <button
                  onClick={() => {
                    setPendingImage(null);
                    setPendingImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Image Preview in Input Area */}
          {pendingImagePreview && (
            <div className="px-4 pt-2 border-t border-gray-200 bg-white">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                <img src={pendingImagePreview} alt="Preview" className="w-12 h-12 rounded object-cover border border-gray-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{pendingImage?.name}</p>
                  <p className="text-xs text-gray-500">Ready to send</p>
                </div>
                <button
                  onClick={() => {
                    setPendingImage(null);
                    setPendingImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-3">
            <div className="flex gap-2 items-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="chat-image-upload"
              />
              <label
                htmlFor="chat-image-upload"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer flex-shrink-0"
                title="Upload image"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </label>
              
              {/* Voice Input Button */}
              {recognitionRef.current && (
                <button
                  onClick={handleVoiceInput}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors flex-shrink-0 ${
                    isListening 
                      ? 'bg-red-100 hover:bg-red-200 text-red-600 animate-pulse' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  title={isListening ? "Listening... Click to stop" : "Voice input"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}

              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    // Auto-resize textarea
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  rows={1}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-full focus:ring-2 focus:ring-brand focus:border-transparent resize-none pr-12 max-h-32 overflow-y-auto"
                  style={{ minHeight: '44px' }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() && !pendingImage}
                  className="absolute right-2 bottom-2 w-9 h-9 bg-gradient-to-r from-brand to-brand-accent text-white rounded-full hover:from-brand-dark hover:to-brand transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
