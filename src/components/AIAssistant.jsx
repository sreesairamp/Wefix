import { useState, useRef, useEffect } from 'react';
import { processChatMessage, analyzeUserIssue } from '../utils/chatAI';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm WeFix Smart AI. I can help you report issues, analyze images, classify problems, and answer questions about civic issues. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingImagePreview, setPendingImagePreview] = useState(null);
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const addMessage = (type, content, analysis = null) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      analysis,
      timestamp: new Date(),
      suggestions: content.suggestions || []
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

    setInputValue('');
    setIsTyping(true);

    try {
      // If there's an image or substantial text, analyze it
      if (pendingImage || (userMessage.length > 10 && !userMessage.match(/^(hi|hello|hey|help|what|how)/i))) {
        const analysisResult = await analyzeUserIssue(userMessage || 'Issue detected from image', pendingImage);
        
        simulateTyping(() => {
          addMessage('ai', analysisResult.content, analysisResult.analysis);
          setPendingImage(null);
          setPendingImagePreview(null);
        }, 1200);
      } else {
        // Process as chat message
        const response = processChatMessage(userMessage, messages);
        
        simulateTyping(() => {
          if (response.type === 'analysis_request') {
            // Trigger analysis
            handleAnalyzeIssue(response.userMessage, pendingImage);
          } else {
            addMessage('ai', response.content);
          }
          
          if (pendingImage) {
            setPendingImage(null);
            setPendingImagePreview(null);
          }
        }, 800);
      }
    } catch (error) {
      console.error('Chat error:', error);
      simulateTyping(() => {
        addMessage('ai', "I encountered an error. Please try again.");
      });
    }
  };

  const handleAnalyzeIssue = async (text, imageFile) => {
    try {
      const analysisResult = await analyzeUserIssue(text, imageFile);
      addMessage('ai', analysisResult.content, analysisResult.analysis);
      setPendingImage(null);
      setPendingImagePreview(null);
    } catch (error) {
      console.error('Analysis error:', error);
      addMessage('ai', "I encountered an error while analyzing. Please try again.");
    }
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
        latitude: 17.385,
        longitude: 78.4867,
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
            <button
              onClick={() => {
                setIsOpen(false);
                // Reset conversation when closing
                setMessages([{
                  id: 1,
                  type: 'ai',
                  content: "Hello! I'm WeFix Smart AI. I can help you report issues, analyze images, classify problems, and answer questions about civic issues. How can I assist you today?",
                  timestamp: new Date()
                }]);
                setInputValue('');
                setPendingImage(null);
                setPendingImagePreview(null);
              }}
              className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
                  
                  <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.content}
                  </div>
                  
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
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </label>

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
