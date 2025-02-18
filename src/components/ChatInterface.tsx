import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Loader2, X, Image as ImageIcon, MessageSquare, 
  Wand2, PanelRight, Upload, Sparkles, Download
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { GoogleGenerativeAI } from '@google/generative-ai';
import TextareaAutosize from 'react-textarea-autosize';
import { useDropzone } from 'react-dropzone';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image';
  images?: string[];
}

interface ChatInterfaceProps {
  onClose: () => void;
}

const genAI = new GoogleGenerativeAI('AIzaSyA7kHmsDCYBqBrlXCkRaMxZxppbd2E9oJk');

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      images: attachedFiles.map(file => URL.createObjectURL(file))
    }]);
    setIsLoading(true);

    try {
      if (isImageMode) {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
        // Note: Image generation would be implemented here
        // For now, we'll simulate with a placeholder response
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Image generation is coming soon! This is a placeholder response.",
          type: 'text'
        }]);
      } else {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(userMessage);
        const response = await result.response;
        const text = response.text();

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: text,
          type: 'text'
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try again.",
        type: 'text'
      }]);
    } finally {
      setIsLoading(false);
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
    <div className="fixed inset-0 bg-background z-50">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
            <X size={20} />
          </button>
          <h2 className="font-outfit font-semibold text-xl">Sarux AI Chat</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsImageMode(!isImageMode)}
            className={`p-2 rounded-lg transition-colors ${
              isImageMode ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/10'
            }`}
          >
            <ImageIcon size={20} />
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-2 rounded-lg transition-colors ${
              showSidebar ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/10'
            }`}
          >
            <PanelRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
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
                        ? 'bg-purple-500/20 ml-auto'
                        : 'bg-white/5 mr-auto'
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
                                style={atomDark}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className="bg-black/20 rounded px-1" {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      {message.role === 'user' && (
                        <button
                          onClick={() => improveMessage(message.id)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Improve message"
                        >
                          <Wand2 size={16} />
                        </button>
                      )}
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
                <div className="bg-white/5 p-4 rounded-2xl">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-white/10 p-4">
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
                  className="w-full bg-white/5 rounded-xl px-4 py-3 pr-12 min-h-[44px] max-h-[200px] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  minRows={1}
                  maxRows={5}
                />
                <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                    >
                      <Upload size={20} />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
                    className="p-2 text-purple-500 hover:text-purple-400 disabled:opacity-50 disabled:hover:text-purple-500 transition-colors"
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
              className="border-l border-white/10 bg-white/5 overflow-hidden"
            >
              <div className="p-4">
                <h3 className="font-outfit font-semibold mb-4">Chat Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Image Generation</span>
                    <button
                      onClick={() => setIsImageMode(!isImageMode)}
                      className={`p-2 rounded-lg transition-colors ${
                        isImageMode ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10'
                      }`}
                    >
                      <ImageIcon size={20} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Chat Mode</span>
                    <button
                      className="p-2 rounded-lg bg-white/10 transition-colors"
                    >
                      <MessageSquare size={20} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Creative Mode</span>
                    <button
                      className="p-2 rounded-lg bg-white/10 transition-colors"
                    >
                      <Sparkles size={20} />
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