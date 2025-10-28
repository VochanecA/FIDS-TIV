// src/components/AIChat.tsx
'use client';

import Image from 'next/image';
import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
  useCallback,
} from 'react';
import type { AIMessage } from '@/lib/ai';
import ReactMarkdown from 'react-markdown';

// Define interfaces for type safety
interface SubscriptionDebugInfo {
  userId: string;
  userEmail?: string;
  customerId?: string;
  subscriptionsFound: number;
  subscriptions?: Array<{
    subscription_id: string;
    subscription_status: string;
    created_at: string;
  }>;
}

interface AIChatProps {
  className?: string;
  initialPrompt?: string;
  title?: string;
  description?: string;
  userId?: string;
}

interface AIChatRef {
  openChat: () => void;
  clearConversation: () => void;
  focusInput: () => void;
}

interface APIResponse {
  content?: string;
  error?: string;
  debug?: SubscriptionDebugInfo;
}

interface FileUploadEvent extends React.ChangeEvent<HTMLInputElement> {
  target: HTMLInputElement & {
    files: FileList;
  };
}

const AIChat = forwardRef<AIChatRef, AIChatProps>(
  (
    {
      className = '',
      initialPrompt = `You are DeepSeek, an advanced AI assistant designed to provide precise, reliable, and user-focused responses. Adhere to these guidelines:
1. Reason step-by-step to deliver logical, accurate, and well-structured answers.
2. Provide clear, concise responses using short, direct sentences.
3. Substantiate claims with credible, verifiable references or data, citing sources where applicable.
4. Avoid exaggerated, vague, or promotional language.
5. Eliminate unnecessary adverbs, filler words, or redundant phrases.
6. Include specific, relevant examples and practical, actionable steps.
7. Exclude irrelevant details to maintain focus and brevity.
8. Use a professional yet conversational tone to ensure responses are engaging and accessible.
9. When analyzing images, describe visual elements objectively and provide insights based on observed content.
10. Reflect thoroughly before answering to ensure high-quality, thoughtful responses.
11. Ensure all recommendations are practical, tested, or proven effective within the European Union context.
12. Tailor advice to comply with EU laws, regulations (e.g., GDPR, consumer protections), and local standards, ensuring relevance to EU-specific conditions.
13. Prioritize user intent by interpreting queries carefully and seeking clarification if the request is ambiguous or incomplete.
14. Uphold ethical standards, ensuring responses are unbiased, inclusive, and respect EU values such as diversity and fairness.
15. Adapt responses to the user's expertise level, providing beginner-friendly explanations or advanced insights as appropriate.`,
      title = 'Your AI Assistant',
      description = 'Ask me anything! I can analyze text and images 😊',
      userId,
    },
    ref
  ) => {
    const [message, setMessage] = useState<string>('');
    const [conversation, setConversation] = useState<AIMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [aiAvailable] = useState<boolean>(true);
    const [isMinimized, setIsMinimized] = useState<boolean>(false);
    const [uploadingImage, setUploadingImage] = useState<boolean>(false);
    const [authError, setAuthError] = useState<'auth' | 'subscription' | null>(null);
    const [debugInfo, setDebugInfo] = useState<SubscriptionDebugInfo | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation, isLoading]);

    useImperativeHandle(ref, () => ({
      openChat: () => {
        setIsMinimized(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      },
      clearConversation: () => {
        setConversation([]);
        setAuthError(null);
        setDebugInfo(null);
        setTimeout(() => inputRef.current?.focus(), 100);
      },
      focusInput: () => inputRef.current?.focus(),
    }));

    const handleSendMessage = useCallback(async (imageData?: string): Promise<void> => {
      const messageToSend = imageData ? `[Image attached] ${message}` : message;
      if ((!messageToSend.trim() && !imageData) || isLoading || !aiAvailable) {
        return;
      }
      
      setIsLoading(true);
      setAuthError(null);
      setDebugInfo(null);
      setMessage('');
      
      const updatedConversation: AIMessage[] = [
        ...conversation,
        { 
          role: 'user', 
          content: messageToSend, 
          ...(imageData && { image: imageData }) 
        },
      ];
      setConversation(updatedConversation);
      
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            messages:
              conversation.length === 0
                ? [
                    { role: 'system', content: initialPrompt },
                    { role: 'user', content: messageToSend, ...(imageData && { image: imageData }) },
                  ]
                : updatedConversation,
            ...(userId && { userId }),
          }),
        });

        const responseText = await response.text();
        let responseData: APIResponse;
        
        try {
          responseData = JSON.parse(responseText) as APIResponse;
        } catch (e) {
          responseData = { raw: responseText } as unknown as APIResponse;
        }
        
        if (!response.ok) {
          let errorMessage = 'Sorry, I encountered an error processing your request.';
          
          if (response.status === 401) {
            errorMessage = 'Authentication required. Please log in to use this feature.';
            setAuthError('auth');
          } else if (response.status === 403) {
            errorMessage = 'Subscription required. Please subscribe to use this feature.';
            setAuthError('subscription');
            
            if (responseData.debug) {
              setDebugInfo(responseData.debug);
              console.log('Subscription debug info:', responseData.debug);
            }
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          
          console.error('API Error:', {
            status: response.status,
            statusText: response.statusText,
            data: responseData,
          });
          
          throw new Error(errorMessage);
        }
        
        if (!responseData.content) {
          throw new Error('No content received from API');
        }
        
        setConversation([
          ...updatedConversation,
          { role: 'assistant', content: responseData.content },
        ]);
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        
        setConversation([
          ...updatedConversation,
          {
            role: 'assistant',
            content: errorMessage,
          },
        ]);
      } finally {
        setIsLoading(false);
        setUploadingImage(false);
      }
    }, [message, isLoading, aiAvailable, conversation, initialPrompt, userId]);

    const handleImageUpload = useCallback((e: FileUploadEvent) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Please upload an image smaller than 5MB');
        return;
      }
      
      setUploadingImage(true);
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        void handleSendMessage(imageData);
      };
      
      reader.readAsDataURL(file);
    }, [handleSendMessage]);

    if (isMinimized) {
      return (
        <div
          className={`fixed bottom-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 sm:p-4 rounded-full shadow-2xl cursor-pointer transition-all hover:scale-105 ${className}`}
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                />
              </svg>
            </div>
            <span className="text-sm font-semibold">AI Assistant</span>
            {conversation.length > 0 && (
              <span className="bg-white/30 text-xs px-2 py-1 rounded-full">
                {conversation.length}
              </span>
            )}
          </div>
        </div>
      );
    }

    return (
      <div 
        className={`w-full sm:max-w-5xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[80vh] ${className}`}
        role="dialog"
        aria-label="AI Chat"
      >
        {/* Header */}
        <div 
          className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 p-4 sm:p-6 rounded-t-2xl border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
          role="heading"
          aria-level={2}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title} 🤖
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div 
          className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto"
          role="log"
          aria-live="polite"
        >
          {conversation.length === 0 ? (
            <div className="text-center text-gray-600 dark:text-gray-300 py-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Image 
                  src="/smiley2.png" 
                  alt="Smiley face" 
                  width={64} 
                  height={64} 
                  priority 
                  style={{ borderRadius: '9999px' }} 
                />
              </div>
              <p className="text-lg font-medium mb-2">
                Hello! I&apos;m your AI assistant 😊
              </p>
              <p className="text-sm mb-6">
                I can help answer questions, analyze images, and provide insights. How can I assist you today?
              </p>
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[90%] sm:max-w-[80%] p-4 rounded-2xl shadow-md ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <div 
                    className={`text-xs mt-2 opacity-70 ${
                      msg.role === 'user' 
                        ? 'text-white/70' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {msg.role === 'user' ? 'You' : 'AI'} • {
                      new Date().toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })
                    }
                  </div>
                </div>
              </div>
            ))
          )}
          
          {authError === 'auth' && (
            <div 
              className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded"
              role="alert"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg 
                    className="h-5 w-5 text-yellow-400" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-200">
                    Authentication required. Please{' '}
                    <a 
                      href="/login" 
                      className="font-medium underline"
                      aria-label="Log in to use this feature"
                    >
                      log in
                    </a>{' '}
                    to use this feature.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {authError === 'subscription' && (
            <div 
              className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 p-4 rounded"
              role="alert"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg 
                    className="h-5 w-5 text-blue-400" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    Subscription required. Please{' '}
                    <a 
                      href="/pricing" 
                      className="font-medium underline"
                      aria-label="Subscribe to use this feature"
                    >
                      subscribe
                    </a>{' '}
                    to use this feature.
                  </p>
                  
                  {debugInfo && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-blue-600 dark:text-blue-300 font-medium">
                        Debug Information
                      </summary>
                      <pre className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/50 rounded text-blue-800 dark:text-blue-200 overflow-x-auto">
                        {JSON.stringify(debugInfo, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div 
                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-2xl rounded-bl-none max-w-[90%] sm:max-w-[80%] shadow-md"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="flex space-x-1 items-center">
                  <div className="w-2 h-2 bg-blue-500/70 rounded-full animate-bounce"></div>
                  <div 
                    className="w-2 h-2 bg-blue-500/70 rounded-full animate-bounce" 
                    style={{ animationDelay: '0.1s' }} 
                  />
                  <div 
                    className="w-2 h-2 bg-blue-500/70 rounded-full animate-bounce" 
                    style={{ animationDelay: '0.2s' }} 
                  />
                  <span className="text-xs ml-2 font-medium">
                    {uploadingImage ? 'Analyzing image...' : 'Thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-x-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden"
              aria-label="Upload image"
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isLoading || !aiAvailable} 
              className="px-3 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-400/50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center" 
              title="Upload image"
              aria-label="Upload image"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </button>
            <input 
              ref={inputRef} 
              type="text" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && void handleSendMessage()} 
              placeholder="Ask your AI assistant..." 
              className="flex-1 min-w-0 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" 
              disabled={isLoading || !aiAvailable} 
              aria-label="Type your message"
            />
            <button 
              onClick={() => void handleSendMessage()} 
              disabled={isLoading || (!message.trim() && !uploadingImage) || !aiAvailable} 
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-md" 
              title="Send message"
              aria-label="Send message"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                />
              </svg>
            </button>
          </div>
          {!aiAvailable && (
            <p className="text-xs text-red-500 mt-2 text-center">
              AI service is currently unavailable. Please check your configuration.
            </p>
          )}
        </div>
      </div>
    );
  }
);

AIChat.displayName = 'AIChat';

export default AIChat;