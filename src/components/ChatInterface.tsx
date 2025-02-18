import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Loader2, X, Image as ImageIcon, MessageSquare, 
  Wand2, PanelRight, Upload, Sparkles, Download, Zap,
  Code, Palette, Bot, Settings, Share2, Bookmark,
  Crown, Coffee, ThumbsUp, ThumbsDown, Sun, Moon,
  Copy, Download as DownloadIcon, Trash2, Volume2,
  BrainCircuit, Lightbulb, Rocket, Mic, MicOff,
  RefreshCcw, History, Lock, Unlock, FileText,
  Languages, Maximize2, Minimize2, RotateCcw, AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { GoogleGenerativeAI } from '@google/generative-ai';
import TextareaAutosize from 'react-textarea-autosize';
import { useDropzone } from 'react-dropzone';

// Initialize Gemini AI with API key from environment variables
const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;

if (!API_KEY) {
  console.error('Google AI API key is not configured. Please check your environment variables.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Enhanced chat modes with more specific configurations
const CHAT_MODES = [
  { 
    id: 'creative',
    name: 'Creative',
    icon: <Sparkles size={20} />,
    description: 'More imaginative and experimental responses',
    temperature: 0.9,
    topK: 40,
    topP: 0.95,
  },
  { 
    id: 'precise',
    name: 'Precise',
    icon: <BrainCircuit size={20} />,
    description: 'Factual and accurate responses',
    temperature: 0.3,
    topK: 20,
    topP: 0.8,
  },
  { 
    id: 'balanced',
    name: 'Balanced',
    icon: <Lightbulb size={20} />,
    description: 'Mix of creativity and accuracy',
    temperature: 0.7,
    topK: 30,
    topP: 0.9,
  },
  {
    id: 'expert',
    name: 'Expert',
    icon: <Crown size={20} />,
    description: 'Technical and detailed responses',
    temperature: 0.5,
    topK: 25,
    topP: 0.85,
  }
];

// Enhanced prompt suggestions
const PROMPT_SUGGESTIONS = [
  { icon: <Code size={16} />, text: "Generate a React component" },
  { icon: <Palette size={16} />, text: "Create a color palette" },
  { icon: <Bot size={16} />, text: "Explain how AI works" },
  { icon: <Coffee size={16} />, text: "Design a landing page" },
  { icon: <BrainCircuit size={16} />, text: "Optimize my code" },
  { icon: <Lightbulb size={16} />, text: "Suggest improvements" },
  { icon: <Rocket size={16} />, text: "Start a new project" },
  { icon: <Languages size={16} />, text: "Translate text" },
  { icon: <FileText size={16} />, text: "Summarize content" }
];

// Interface definitions
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
  edited?: boolean;
  context?: string;
}

interface ChatSettings {
  autoScroll: boolean;
  soundEffects: boolean;
  markdownPreview: boolean;
  autoComplete: boolean;
  spellCheck: boolean;
  fontSize: number;
  maxTokens: number;
  temperature: number;
  topK: number;
  topP: number;
}

// Default settings
const DEFAULT_SETTINGS: ChatSettings = {
  autoScroll: true,
  soundEffects: true,
  markdownPreview: true,
  autoComplete: true,
  spellCheck: true,
  fontSize: 14,
  maxTokens: 1000,
  temperature: 0.7,
  topK: 30,
  topP: 0.9,
};

interface ChatInterfaceProps {
  onClose: () => void;
  isDarkMode: boolean;
  onThemeChange: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose, isDarkMode, onThemeChange }) => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [chatMode, setChatMode] = useState('balanced');
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
  const [savedMessages, setSavedMessages] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<Message[][]>([]);
  const [redoStack, setRedoStack] = useState<Message[][]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    onDrop: (acceptedFiles) => {
      setAttachedFiles(prev => [...prev, ...acceptedFiles]);
    }
  });

  // Speech recognition setup
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Here you would typically send this to a speech-to-text service
        // For now, we'll just show that it's captured
        setInput(prev => prev + " [Audio input captured]");
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Enhanced message handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    const userMessage = input.trim();
    const messageId = Date.now().toString();
    
    setUndoStack(prev => [...prev, messages]);
    setRedoStack([]);

    const newUserMessage: Message = {
      id: messageId,
      role: 'user',
      content: userMessage,
      type: isImageMode ? 'image' : 'text',
      images: attachedFiles.map(file => URL.createObjectURL(file)),
      timestamp: new Date(),
      context: chatMode
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!API_KEY) {
        throw new Error('Google AI API key is not configured. Please check your environment variables.');
      }

      const currentMode = CHAT_MODES.find(mode => mode.id === chatMode) || CHAT_MODES[2];

      if (isImageMode && attachedFiles.length > 0) {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
        
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
        if (!result.response) {
          throw new Error('No response received from AI model');
        }
        const response = await result.response;
        const text = response.text();

        addAssistantMessage(text);
      } else {
        const model = genAI.getGenerativeModel({ 
          model: "gemini-pro",
          generationConfig: {
            temperature: currentMode.temperature,
            topK: currentMode.topK,
            topP: currentMode.topP,
            maxOutputTokens: settings.maxTokens,
          }
        });

        const chat = model.startChat({
          history: messages.map(msg => ({
            role: msg.role,
            parts: msg.content
          }))
        });

        const result = await chat.sendMessage(userMessage);
        if (!result.response) {
          throw new Error('No response received from AI model');
        }
        const response = await result.response;
        const text = response.text();

        addAssistantMessage(text);
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while processing your request';
      
      addAssistantMessage(`I apologize, but I encountered an error: ${errorMessage}. Please try again or contact support if the issue persists.`);
      console.error('AI Error:', error);
    } finally {
      setIsLoading(false);
      setAttachedFiles([]);
      if (settings.autoScroll) {
        scrollToBottom();
      }
    }
  };

  const addAssistantMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      type: 'text',
      likes: 0,
      saved: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageHistory(prev => [...prev, newMessage]);
  };

  // Utility functions
  const scrollToBottom = () => {
    if (settings.autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, messages]);
      setMessages(previousState);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, messages]);
      setMessages(nextState);
      setRedoStack(prev => prev.slice(0, -1));
    }
  };

  // Settings panel component
  const SettingsPanel = () => (
    <div className={`p-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-lg`}>
      <h3 className="font-outfit font-semibold mb-4">Chat Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Auto-scroll</span>
          <button
            onClick={() => setSettings(prev => ({ ...prev, autoScroll: !prev.autoScroll }))}
            className={`p-2 rounded-lg ${settings.autoScroll ? 'bg-purple-500/20' : 'bg-gray-200'}`}
          >
            {settings.autoScroll ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Sound Effects</span>
          <button
            onClick={() => setSettings(prev => ({ ...prev, soundEffects: !prev.soundEffects }))}
            className={`p-2 rounded-lg ${settings.soundEffects ? 'bg-purple-500/20' : 'bg-gray-200'}`}
          >
            {settings.soundEffects ? <Volume2 size={16} /> : <Volume2 size={16} className="text-gray-400" />}
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-sm">Font Size</label>
          <input
            type="range"
            min="12"
            max="20"
            value={settings.fontSize}
            onChange={(e) => setSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm">Max Tokens</label>
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={settings.maxTokens}
            onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="text-xs text-gray-500">{settings.maxTokens} tokens</div>
        </div>
      </div>
    </div>
  );

  // Enhanced toolbar component
  const Toolbar = () => (
    <div className="flex items-center space-x-2 px-4 py-2">
      <button
        onClick={handleUndo}
        disabled={undoStack.length === 0}
        className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50"
        title="Undo"
      >
        <RotateCcw size={16} />
      </button>
      <button
        onClick={handleRedo}
        disabled={redoStack.length === 0}
        className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-50"
        title="Redo"
      >
        <RefreshCcw size={16} />
      </button>
      <button
        onClick={toggleFullscreen}
        className="p-2 rounded-lg hover:bg-white/10"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );

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
        <Toolbar />
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
                  <span>{mode.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-purple-500/20 ml-auto'
                      : theme === 'dark'
                        ? 'bg-white/5'
                        : 'bg-white'
                  }`}
                >
                  {message.type === 'text' ? (
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
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <div>
                      {message.images?.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Uploaded ${index + 1}`}
                          className="max-w-full rounded-lg mb-2"
                        />
                      ))}
                      {message.content && (
                        <p className="mt-2">{message.content}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`max-w-[80%] rounded-lg p-4 ${
                  theme === 'dark' ? 'bg-white/5' : 'bg-white'
                }`}>
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={`p-4 border-t ${
            theme === 'dark' ? 'border-white/10' : 'border-gray-200'
          }`}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImageMode(!isImageMode)}
                  className={`p-2 rounded-lg ${
                    isImageMode
                      ? 'bg-purple-500/20 text-purple-400'
                      : theme === 'dark'
                        ? 'hover:bg-white/10'
                        : 'hover:bg-gray-100'
                  }`}
                >
                  <ImageIcon size={20} />
                </button>
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-2 rounded-lg ${
                    isRecording
                      ? 'bg-red-500/20 text-red-400'
                      : theme === 'dark'
                        ? 'hover:bg-white/10'
                        : 'hover:bg-gray-100'
                  }`}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <div className="flex-1">
                  <TextareaAutosize
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className={`w-full px-4 py-2 rounded-lg resize-none ${
                      theme === 'dark'
                        ? 'bg-white/5 focus:bg-white/10'
                        : 'bg-white focus:bg-gray-50'
                    } border ${
                      theme === 'dark'
                        ? 'border-white/10'
                        : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    minRows={1}
                    maxRows={5}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
                  className="p-2 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:hover:bg-purple-500"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
              
              {isImageMode && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-purple-500 bg-purple-500/10'
                      : theme === 'dark'
                        ? 'border-white/10 hover:border-white/20'
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-6 h-6 mx-auto mb-2" />
                  <p>Drag & drop images here, or click to select files</p>
                </div>
              )}

              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                        theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'
                      }`}
                    >
                      <ImageIcon size={16} />
                      <span className="text-sm truncate max-w-[150px]">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedFiles(prev =>
                            prev.filter((_, i) => i !== index)
                          );
                        }}
                        className="hover:text-red-400"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Settings Sidebar */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className={`w-80 border-l ${
                theme === 'dark' ? 'border-white/10' : 'border-gray-200'
              } overflow-y-auto`}
            >
              <SettingsPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatInterface;