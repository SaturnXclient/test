import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Loader2, X, Image as ImageIcon, MessageSquare, 
  Wand2, PanelRight, Upload, Sparkles, Download, Zap,
  Code, Palette, Bot, Settings, Share2, Bookmark,
  Crown, Coffee, ThumbsUp, ThumbsDown, Sun, Moon,
  Copy, Download as DownloadIcon, Trash2, Volume2,
  BrainCircuit, Lightbulb, Rocket
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { GoogleGenerativeAI } from '@google/generative-ai';
import TextareaAutosize from 'react-textarea-autosize';
import { useDropzone } from 'react-dropzone';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'code';
  images?: string[];
  likes?: number;
  saved?: boolean;
  codeLanguage?: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onClose: () => void;
}

const genAI = new GoogleGenerativeAI('AIzaSyCVbHlnda_Bb8TvMCN9wFsbJ1OQQQmZU7A');

const PROMPT_SUGGESTIONS = [
  { icon: <Code size={16} />, text: "Generate a React component" },
  { icon: <Palette size={16} />, text: "Create a color palette" },
  { icon: <Bot size={16} />, text: "Explain how AI works" },
  { icon: <Coffee size={16} />, text: "Design a landing page" },
  { icon: <BrainCircuit size={16} />, text: "Optimize my code" },
  { icon: <Lightbulb size={16} />, text: "Suggest improvements" },
  { icon: <Rocket size={16} />, text: "Start a new project" }
];

const CODE_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'rust',
  'go', 'ruby', 'php', 'swift', 'kotlin', 'scala'
];

const CHAT_MODES = [
  { id: 'creative', name: 'Creative', icon: <Sparkles size={20} /> },
  { id: 'precise', name: 'Precise', icon: <BrainCircuit size={20} /> },
  { id: 'balanced', name: 'Balanced', icon: <Lightbulb size={20} /> }
];

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatMode, setChatMode] = useState('balanced');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [savedMessages, setSavedMessages] = useState<string[]>([]);
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    onDrop: (acceptedFiles) => {
      setAttachedFiles(prev => [...prev, ...acceptedFiles]);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load message history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      setMessageHistory(parsedHistory.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    }
  }, []);

  // Save message history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      const historyToSave = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }));
      localStorage.setItem('chatHistory', JSON.stringify(historyToSave));
    }
  }, [messages]);

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt);
  };

  const toggleMessageSave = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, saved: !msg.saved } : msg
    ));
    setSavedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleLikeDislike = (messageId: string, isLike: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, likes: (msg.likes || 0) + (isLike ? 1 : -1) }
        : msg
    ));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      localStorage.removeItem('chatHistory');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    const userMessage = input.trim();
    const messageId = Date.now().toString();
    setInput('');
    setMessages(prev => [...prev, { 
      id: messageId,
      role: 'user', 
      content: userMessage,
      type: isImageMode ? 'image' : 'text',
      images: attachedFiles.map(file => URL.createObjectURL(file)),
      timestamp: new Date()
    }]);
    setIsLoading(true);
    setIsStreaming(true);

    try {
      if (isImageMode) {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
        
        // Convert images to base64
        const imageFiles = await Promise.all(
          attachedFiles.map(async (file) => {
            const bytes = await file.arrayBuffer();
            return {
              inlineData: {
                data: Buffer.from(bytes).toString('base64'),
                mimeType: file.type
              }
            };
          })
        );

        const result = await model.generateContent([userMessage, ...imageFiles]);
        const response = await result.response;
        const text = response.text();

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: text,
          type: 'text',
          likes: 0,
          saved: false,
          timestamp: new Date()
        }]);
      } else {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        // Add chat mode context to the prompt
        let contextPrompt = '';
        switch (chatMode) {
          case 'creative':
            contextPrompt = 'Be creative and think outside the box. ';
            break;
          case 'precise':
            contextPrompt = 'Be precise and technical in your response. ';
            break;
          case 'balanced':
            contextPrompt = 'Provide a balanced response with both technical accuracy and clarity. ';
            break;
        }

        const result = await model.generateContent(contextPrompt + userMessage);
        const response = await result.response;
        const text = response.text();

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: text,
          type: 'text',
          likes: 0,
          saved: false,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try again.",
        type: 'text',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setAttachedFiles([]);
    }
  };

  const improveMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.role !== 'user') return;

    setIsLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(
        `Improve this message by making it more clear, professional, and detailed: ${message.content}`
      );
      const response = await result.response;
      const improvedText = response.text();

      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, content: improvedText } : m
      ));
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'} z-50`}>
      {/* Header */}
      <div className={`h-16 border-b ${
        theme === 'dark' ? 'border-white/10' : 'border-gray-200'
      } flex items-center justify-between px-4`}>
        <div className="flex items-center space-x-4">
          <button 
            onClick={onClose} 
            className={`p-2 ${
              theme === 'dark' 
                ? 'hover:bg-white/10' 
                : 'hover:bg-gray-100'
            } rounded-lg`}
          >
            <X size={20} className={theme === 'dark' ? 'text-white' : 'text-gray-900'} />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-500" />
            <h2 className={`font-outfit font-semibold text-xl ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Sarux AI Chat
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsImageMode(!isImageMode)}
            className={`p-2 rounded-lg transition-colors ${
              isImageMode 
                ? 'bg-purple-500/20 text-purple-400' 
                : theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
            title="Toggle Image Mode"
          >
            <ImageIcon size={20} />
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-2 rounded-lg transition-colors ${
              showSidebar 
                ? 'bg-purple-500/20 text-purple-400' 
                : theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
            title="Toggle Sidebar"
          >
            <PanelRight size={20} />
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 ${
              theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            } rounded-lg`}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Mode Selector */}
          <div className={`p-4 border-b ${
            theme === 'dark' ? 'border-white/10' : 'border-gray-200'
          }`}>
            <div className="flex gap-4 justify-center">
              {CHAT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setChatMode(mode.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    chatMode === mode.id
                      ? 'bg-purple-500/20 text-purple-400'
                      : theme === 'dark' 
                        ? 'hover:bg-white/10' 
                        : 'hover:bg-gray-100'
                  }`}
                >
                  {mode.icon}
                  <span className="text-sm font-medium">{mode.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Suggestions */}
          <div className={`p-4 border-b ${
            theme === 'dark' ? 'border-white/10' : 'border-gray-200'
          }`}>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptSelect(suggestion.text)}
                  className={`flex items-center gap-2 px-3 py-2 ${
                    theme === 'dark'
                      ? 'bg-white/5 hover:bg-white/10'
                      : 'bg-gray-100 hover:bg-gray-200'
                  } rounded-lg transition-colors whitespace-nowrap`}
                >
                  {suggestion.icon}
                  <span className="text-sm">{suggestion.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      message.role === 'user'
                        ? theme === 'dark'
                          ? 'bg-purple-500/20 ml-auto'
                          : 'bg-purple-100 ml-auto'
                        : theme === 'dark'
                          ? 'bg-white/5 mr-auto'
                          : 'bg-gray-100 mr-auto'
                    }`}
                  >
                    {message.images && message.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {message.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt="Attached"
                            className="rounded-lg max-h-48 object-cover"
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <ReactMarkdown
                        components={{
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={theme === 'dark' ? atomDark : oneLight}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={`${
                                theme === 'dark' ? 'bg-black/20' : 'bg-gray-200'
                              } rounded px-1`} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-2">
                      {message.role === 'assistant' && (
                        <>
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className={`p-1 ${
                              theme === 'dark'
                                ? 'hover:bg-white/10'
                                : 'hover:bg-gray-200'
                            } rounded transition-colors`}
                            title="Copy to Clipboard"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => isSpeaking ? stopSpeaking() : speakMessage(message.content)}
                            className={`p-1 ${
                              theme === 'dark'
                                ? 'hover:bg-white/10'
                                : 'hover:bg-gray-200'
                            } rounded transition-colors ${
                              isSpeaking ? 'text-purple-500' : ''
                            }`}
                            title={isSpeaking ? "Stop Speaking" : "Speak Message"}
                          >
                            <Volume2 size={14} />
                          </button>
                          <button
                            onClick={() => handleLikeDislike(message.id, true)}
                            className={`p-1 ${
                              theme === 'dark'
                                ? 'hover:bg-white/10'
                                : 'hover:bg-gray-200'
                            } rounded transition-colors`}
                            title="Like"
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button
                            onClick={() => handleLikeDislike(message.id, false)}
                            className={`p-1 ${
                              theme === 'dark'
                                ? 'hover:bg-white/10'
                                : 'hover:bg-gray-200'
                            } rounded transition-colors`}
                            title="Dislike"
                          >
                            <ThumbsDown size={14} />
                          </button>
                          <button
                            onClick={() => toggleMessageSave(message.id)}
                            className={`p-1 ${
                              theme === 'dark'
                                ? 'hover:bg-white/10'
                                : 'hover:bg-gray-200'
                            } rounded transition-colors ${
                              message.saved ? 'text-yellow-500' : ''
                            }`}
                            title={message.saved ? 'Unsave' : 'Save'}
                          >
                            <Bookmark size={14} />
                          </button>
                          <button
                            onClick={() => {/* Add share functionality */}}
                            className={`p-1 ${
                              theme === 'dark'
                                ? 'hover:bg-white/10'
                                : 'hover:bg-gray-200'
                            } rounded transition-colors`}
                            title="Share"
                          >
                            <Share2 size={14} />
                          </button>
                        </>
                      )}
                      {message.role === 'user' && (
                        <button
                          onClick={() => improveMessage(message.id)}
                          className={`p-1 ${
                            theme === 'dark'
                              ? 'hover:bg-white/10'
                              : 'hover:bg-gray-200'
                          } rounded transition-colors`}
                          title="Improve message"
                        >
                          <Wand2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className={`text-xs mt-2 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className={`${
                  theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                } p-4 rounded-2xl`}>
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Code Language Selector */}
          {messages.length > 0 && messages[messages.length - 1].type === 'code' && (
            <div className={`px-4 py-2 border-t ${
              theme === 'dark' ? 'border-white/10' : 'border-gray-200'
            }`}>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={`${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10'
                    : 'bg-gray-100 border-gray-200'
                } border rounded-lg px-3 py-1 text-sm`}
              >
                {CODE_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          )}

          {/* Input Area */}
          <div className={`border-t ${
            theme === 'dark' ? 'border-white/10' : 'border-gray-200'
          } p-4`}>
            {attachedFiles.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setAttachedFiles(files => files.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <div className="flex-1 relative">
                <TextareaAutosize
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder={isImageMode ? "Describe the image you want to generate..." : "Type your message..."}
                  className={`w-full ${
                    theme === 'dark'
                      ? 'bg-white/5 focus:ring-purple-500/50'
                      : 'bg-gray-100 focus:ring-purple-500/30'
                  } rounded-xl px-4 py-3 pr-24 min-h-[44px] max-h-[200px] resize-none focus:outline-none focus:ring-2 transition-all ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                  minRows={1}
                  maxRows={5}
                />
                <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <button
                      type="button"
                      className={`p-2 ${
                        theme === 'dark'
                          ? 'text-gray-400 hover:text-purple-400'
                          : 'text-gray-500 hover:text-purple-500'
                      } transition-colors`}
                      title="Upload Image"
                    >
                      <Upload size={20} />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
                    className={`p-2 ${
                      theme === 'dark'
                        ? 'text-purple-500 hover:text-purple-400'
                        : 'text-purple-600 hover:text-purple-500'
                    } disabled:opacity-50 disabled:hover:text-purple-500 transition-colors`}
                    title="Send Message"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className={`border-l ${
                theme === 'dark'
                  ? 'border-white/10 bg-white/5'
                  : 'border-gray-200 bg-gray-50'
              } overflow-hidden`}
            >
              <div className="p-4">
                <h3 className={`font-outfit font-semibold mb-4 flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Premium Features
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                      Image Generation
                    </span>
                    <button
                      onClick={() => setIsImageMode(!isImageMode)}
                      className={`p-2 rounded-lg transition-colors ${
                        isImageMode
                          ? 'bg-purple-500/20 text-purple-400'
                          : theme === 'dark'
                            ? 'bg-white/10'
                            : 'bg-gray-200'
                      }`}
                    >
                      <ImageIcon size={20} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                      Code Assistant
                    </span>
                    <button
                      className={`p-2 rounded-lg ${
                        theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'
                      } transition-colors`}
                    >
                      <Code size={20} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                      Creative Mode
                    </span>
                    <button
                      className={`p-2 rounded-lg ${
                        theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'
                      } transition-colors`}
                    >
                      <Sparkles size={20} />
                    </button>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className={`font-outfit font-semibold mb-4 flex items-center gap-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Bookmark className="w-5 h-5 text-purple-500" />
                    Saved Messages
                  </h3>
                  <div className="space-y-2">
                    {messages
                      .filter(msg => msg.saved)
                      .map(msg => (
                        <div
                          key={msg.id}
                          className={`p-3 ${
                            theme === 'dark'
                              ? 'bg-white/5'
                              : 'bg-gray-100'
                          } rounded-lg text-sm`}
                        >
                          {msg.content.substring(0, 100)}... ```
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className={`font-outfit font-semibold mb-4 flex items-center gap-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Settings className="w-5 h-5 text-purple-500" />
                    Chat Settings
                  </h3>
                  <div className="space-y-4">
                    <button
                      onClick={clearChat}
                      className={`flex items-center gap-2 w-full p-2 ${
                        theme === 'dark'
                          ? 'bg-white/5 hover:bg-white/10'
                          : 'bg-gray-100 hover:bg-gray-200'
                      } rounded-lg transition-colors`}
                    >
                      <Trash2 size={16} className="text-red-500" />
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                        Clear Chat History
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        const historyData = JSON.stringify(messages, null, 2);
                        const blob = new Blob([historyData], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'chat-history.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className={`flex items-center gap-2 w-full p-2 ${
                        theme === 'dark'
                          ? 'bg-white/5 hover:bg-white/10'
                          : 'bg-gray-100 hover:bg-gray-200'
                      } rounded-lg transition-colors`}
                    >
                      <DownloadIcon size={16} className="text-purple-500" />
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                        Export Chat History
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatInterface;

export default ChatInterface