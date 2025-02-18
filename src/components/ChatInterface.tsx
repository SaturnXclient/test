import React, { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ImageIcon, Send, Mic, MicOff, Upload, Loader2,
  Code, MessageSquare
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

  const startRecording = () => {
    setIsRecording(true);
    // Implement recording logic
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Implement stop recording logic
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      const aiResponse = await getGeminiResponse(input, chatMode as 'code' | 'chat');
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: aiResponse,
        type: 'text'
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        type: 'text'
      }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const Toolbar = () => (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={`p-2 rounded-lg ${
          isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
        }`}
      >
        <ImageIcon size={20} />
      </button>
    </div>
  );

  const SettingsPanel = () => (
    <div className="p-4">
      <h3 className={`text-lg font-semibold mb-4 ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>
        Settings
      </h3>
      {/* Add settings content here */}
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
        <Toolbar />
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
                              style={isDarkMode ? atomDark : oneLight}
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
                      {message.images?.map((image: string, index: number) => (
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