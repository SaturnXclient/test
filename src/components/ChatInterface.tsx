{/* Previous imports remain unchanged */}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose, isDarkMode, onThemeChange }) => {
  // ... previous state and hooks remain unchanged ...

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