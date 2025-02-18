import React, { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ImageIcon, Send, Mic, MicOff, Upload, Loader2,
  Code, MessageSquare, Settings, Share, Pin, ThumbsUp,
  Sun, Moon, Volume2, VolumeX, Palette, MessageCircle,
  Trash2, Copy, BookmarkPlus
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import TextareaAutosize from 'react-textarea-autosize';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getGeminiResponse } from '../lib/gemini';

interface ChatInterfaceProps {
  onClose: () => void;
  isDarkMode: boolean;
  onThemeChange: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image';
  images?: string[];
  liked?: boolean;
  pinned?: boolean;
}

interface Settings {
  fontSize: 'sm' | 'base' | 'lg';
  soundEnabled: boolean;
  autoScroll: boolean;
  codeTheme: 'dark' | 'light';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose, isDarkMode, onThemeChange }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMode, setChatMode] = useState('code');
  const [settings, setSettings] = useState<Settings>({
    fontSize: 'base',
    soundEnabled: true,
    autoScroll: true,
    codeTheme: isDarkMode ? 'dark' : 'light',
  });
  const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const CHAT_MODES = [
    { id: 'code', name: 'Code', icon: <Code className="w-5 h-5" /> },
    { id: 'image', name: 'Image', icon: <ImageIcon className="w-5 h-5" /> },
    { id: 'chat', name: 'Chat', icon: <MessageSquare className="w-5 h-5" /> }
  ];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    onDrop: (acceptedFiles) => {
      setAttachedFiles(prev => [...prev, ...acceptedFiles]);
    }
  });

  const toggleMessagePin = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, pinned: !msg.pinned } : msg
    ));
    setPinnedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const toggleMessageLike = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, liked: !msg.liked } : msg
    ));
  };

  const shareMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      // Show toast or notification
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    if (settings.soundEnabled) {
      // Play sound effect
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (settings.soundEnabled) {
      // Play sound effect
    }
  };

  const scrollToBottom = () => {
    if (settings.autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      type: attachedFiles.length > 0 ? 'image' : 'text',
      images: attachedFiles.length > 0 ? attachedFiles.map(file => URL.createObjectURL(file)) : undefined
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const aiResponse = await getGeminiResponse(input, chatMode as 'code' | 'chat', {
        temperature: chatMode === 'code' ? 0.3 : 0.7,
        maxOutputTokens: chatMode === 'code' ? 2048 : 1024,
      });
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: aiResponse,
        type: 'text'
      }]);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred. Please try again.';

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${errorMessage}`,
        type: 'text'
      }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const MessageActions = ({ message }: { message: Message }) => (
    <div className="flex items-center gap-2 mt-2 text-gray-400">
      <button
        onClick={() => toggleMessageLike(message.id)}
        className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 ${
          message.liked ? 'text-purple-500' : ''
        }`}
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => toggleMessagePin(message.id)}
        className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10 ${
          message.pinned ? 'text-purple-500' : ''
        }`}
      >
        <Pin className="w-4 h-4" />
      </button>
      <button
        onClick={() => shareMessage(message)}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
      >
        <Share className="w-4 h-4" />
      </button>
      <button
        onClick={() => navigator.clipboard.writeText(message.content)}
        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
      >
        <Copy className="w-4 h-4" />
      </button>
    </div>
  );

  const SettingsPanel = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Settings
        </h3>
        <button
          onClick={() => setShowSettings(false)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-3">Appearance</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Theme</span>
              <button
                onClick={onThemeChange}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span>Font Size</span>
              <div className="flex gap-2">
                {(['sm', 'base', 'lg'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => setSettings(prev => ({ ...prev, fontSize: size }))}
                    className={`px-3 py-1 rounded ${
                      settings.fontSize === size
                        ? 'bg-purple-500 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    {size === 'sm' ? 'A' : size === 'base' ? 'AA' : 'AAA'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Code Theme</span>
              <button
                onClick={() => setSettings(prev => ({
                  ...prev,
                  codeTheme: prev.codeTheme === 'dark' ? 'light' : 'dark'
                }))}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <Palette className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3">Behavior</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Sound Effects</span>
              <button
                onClick={() => setSettings(prev => ({
                  ...prev,
                  soundEnabled: !prev.soundEnabled
                }))}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span>Auto-scroll</span>
              <button
                onClick={() => setSettings(prev => ({
                  ...prev,
                  autoScroll: !prev.autoScroll
                }))}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-3">Data</h4>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to clear all messages?')) {
                setMessages([]);
                setPinnedMessages([]);
              }
            }}
            className="flex items-center gap-2 text-red-500 hover:text-red-600"
          >
            <Trash2 className="w-5 h-5" />
            Clear All Messages
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-50 md:p-4">
      <div className={`flex-none h-16 md:h-14 border-b ${
        isDarkMode ? 'border-white/10' : 'border-gray-200'
      } flex items-center justify-between px-4 safe-top`}>
        <div className="flex items-center space-x-4">
          <button 
            onClick={onClose} 
            className={`p-2 ${
              isDarkMode 
                ? 'hover:bg-white/10' 
                : 'hover:bg-gray-100'
            } rounded-lg`}
          >
            <X size={20} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
          </button>
          <h2 className={`font-outfit font-semibold text-xl ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Sarux AI Chat
          </h2>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg ${
            showSettings
              ? 'bg-purple-500/20 text-purple-400'
              : isDarkMode
                ? 'hover:bg-white/10'
                : 'hover:bg-gray-100'
          }`}
        >
          <Settings size={20} />
        </button>
      </div>

      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className={`flex-none p-4 border-b ${
            isDarkMode ? 'border-white/10' : 'border-gray-200'
          }`}>
            <div className="flex gap-4 justify-center">
              {CHAT_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setChatMode(mode.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    chatMode === mode.id
                      ? 'bg-purple-500/20 text-purple-400'
                      : isDarkMode 
                        ? 'hover:bg-white/10' 
                        : 'hover:bg-gray-100'
                  }`}
                >
                  {mode.icon}
                  <span className="hidden sm:inline">{mode.name}</span>
                </button>
              ))}
            </div>
          </div>

          {pinnedMessages.length > 0 && (
            <div className={`flex-none p-4 border-b ${
              isDarkMode ? 'border-white/10' : 'border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Pin className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Pinned Messages</span>
              </div>
              <div className="space-y-2">
                {messages
                  .filter(msg => pinnedMessages.includes(msg.id))
                  .map(msg => (
                    <div
                      key={msg.id}
                      className={`p-2 rounded ${
                        isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                      }`}
                    >
                      <p className="text-sm truncate">{msg.content}</p>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-purple-500/20 ml-auto'
                      : isDarkMode
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
                              style={settings.codeTheme === 'dark' ? atomDark : oneLight}
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
                      className={`text-${settings.fontSize}`}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <div>
                      {message.images?.map((image: string, index: number) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Uploaded ${index + 1}`}
                          className="max-w-full rounded-lg mb-2"
                        />
                      ))}
                      {message.content && (
                        <p className={`mt-2 text-${settings.fontSize}`}>{message.content}</p>
                      )}
                    </div>
                  )}
                  <MessageActions message={message} />
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-4 ${
                  isDarkMode ? 'bg-white/5' : 'bg-white'
                }`}>
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={`flex-none p-4 border-t ${
            isDarkMode ? 'border-white/10' : 'border-gray-200'
          } safe-bottom`}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImageMode(!isImageMode)}
                  className={`p-2 rounded-lg ${
                    isImageMode
                      ? 'bg-purple-500/20 text-purple-400'
                      : isDarkMode
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
                      : isDarkMode
                        ? 'hover:bg-white/10'
                        : 'hover:bg-gray-100'
                  }`}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                <div className="flex-1">
                  <TextareaAutosize
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className={`w-full px-4 py-2 rounded-lg resize-none ${
                      isDarkMode
                        ? 'bg-white/5 focus:bg-white/10'
                        : 'bg-white focus:bg-gray-50'
                    } border ${
                      isDarkMode
                        ? 'border-white/10'
                        : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-${settings.fontSize}`}
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
                    <Send size={20} className="text-white" />
                  )}
                </button>
              </div>
              
              {isImageMode && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-purple-500 bg-purple-500/10'
                      : isDarkMode
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
                        isDarkMode ? 'bg-white/5' : 'bg-gray-100'
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

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className={`w-80 border-l ${
                isDarkMode ? 'border-white/10' : 'border-gray-200'
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