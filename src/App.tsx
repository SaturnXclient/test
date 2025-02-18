import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  Code, Image, MessageSquareText, Shield, Zap, ChevronRight, 
  Sun, Moon, HelpCircle, Laptop, Globe, Database, Cloud, Star
} from 'lucide-react';
import { useTheme } from './lib/theme';
import ParticleBackground from './components/ParticleBackground';
import Button from './components/Button';
import ChatInterface from './components/ChatInterface';
import EarlyAccessForm from './components/EarlyAccessForm';

function App() {
  const navigate = useNavigate();
  const [heroRef, heroInView] = useInView({ triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [techRef, techInView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [showChat, setShowChat] = useState(false);
  const { theme, setTheme } = useTheme();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "AI Researcher",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150",
      content: "Sarux AI has revolutionized our research workflow. The code generation is incredibly accurate and saves us countless hours.",
      rating: 5
    },
    {
      name: "James Wilson",
      role: "Software Architect",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150",
      content: "The image generation capabilities are mind-blowing. It's like having a professional designer on call 24/7.",
      rating: 5
    },
    {
      name: "Elena Rodriguez",
      role: "Product Manager",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150",
      content: "Integrating Sarux AI into our product development cycle has increased our efficiency by 300%.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "What makes Sarux AI different from other AI platforms?",
      answer: "Sarux AI combines advanced code generation, image creation, and prompt enhancement in a single platform, offering unparalleled accuracy and context awareness."
    },
    {
      question: "How secure is my data with Sarux AI?",
      answer: "We implement enterprise-grade security measures including end-to-end encryption, real-time monitoring, and strict access controls to ensure your data remains protected."
    },
    {
      question: "Can I integrate Sarux AI with my existing tools?",
      answer: "Yes, Sarux AI offers seamless integration with popular development tools, design software, and productivity platforms through our comprehensive API."
    },
    {
      question: "What kind of support do you offer?",
      answer: "We provide 24/7 technical support, comprehensive documentation, and regular training sessions to ensure you get the most out of Sarux AI."
    }
  ];

  const integrations = [
    { name: "GitHub", icon: <Code className="w-8 h-8" /> },
    { name: "Figma", icon: <Image className="w-8 h-8" /> },
    { name: "VS Code", icon: <Laptop className="w-8 h-8" /> },
    { name: "Slack", icon: <MessageSquareText className="w-8 h-8" /> },
    { name: "Azure", icon: <Cloud className="w-8 h-8" /> },
    { name: "PostgreSQL", icon: <Database className="w-8 h-8" /> }
  ];

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className={`min-h-screen bg-background text-text transition-colors duration-300 overflow-x-hidden`}>
            <ParticleBackground />
            
            <nav className={`fixed top-0 w-full z-50 ${theme === 'dark' ? 'bg-background/80' : 'bg-white/80'} backdrop-blur-md transition-colors duration-300`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
                    <span className="font-outfit font-bold text-lg sm:text-xl">Sarux AI</span>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <button
                      onClick={toggleTheme}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => navigate('/early-access')}
                      className="hidden sm:inline-flex"
                    >
                      Get Early Access
                    </Button>
                  </div>
                </div>
              </div>
            </nav>

            <motion.section
              ref={heroRef}
              initial={{ opacity: 0, y: 20 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className={`pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'hero-gradient' : 'bg-gradient-to-b from-purple-50 to-white'}`}
            >
              <div className="max-w-7xl mx-auto text-center">
                <h1 className="font-outfit font-bold text-3xl sm:text-4xl md:text-6xl lg:text-7xl mb-4 sm:mb-6 gradient-text leading-tight">
                  Redefining the Boundaries of Artificial Intelligence
                </h1>
                <p className={`text-base sm:text-lg md:text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto mb-8 sm:mb-10 px-4`}>
                  Experience the next evolution in AI technology with unparalleled code generation,
                  image creation, and intelligent prompt enhancement.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
                  <Button size="lg" onClick={() => navigate('/early-access')} className="w-full sm:w-auto">
                    Get Early Access <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => setShowChat(true)} className="w-full sm:w-auto">
                    Try Demo
                  </Button>
                </div>
              </div>
            </motion.section>

            <motion.section
              ref={featuresRef}
              initial={{ opacity: 0, y: 40 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8"
            >
              <div className="max-w-7xl mx-auto">
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-outfit font-bold text-center mb-12 sm:mb-16 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Key Capabilities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {[
                    {
                      icon: <Code className="w-8 h-8 text-purple-500" />,
                      title: "Advanced Code Generation",
                      description: "Multi-language code synthesis with context-aware suggestions and real-time optimization."
                    },
                    {
                      icon: <Image className="w-8 h-8 text-cyan-400" />,
                      title: "AI Image Creation",
                      description: "Generate stunning visuals with our state-of-the-art image synthesis technology."
                    },
                    {
                      icon: <MessageSquareText className="w-8 h-8 text-purple-500" />,
                      title: "Intelligent Prompt Enhancement",
                      description: "Refine and optimize your prompts for better results with our advanced language models."
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.5, delay: index * 0.2 }}
                      className={`${theme === 'dark' ? 'card-gradient' : 'bg-white'} p-6 sm:p-8 rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 group`}
                    >
                      <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                        {feature.icon}
                      </div>
                      <h3 className={`text-lg sm:text-xl font-outfit font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {feature.title}
                      </h3>
                      <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {feature.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>

            <section className={`py-20 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'}`}>
              <div className="max-w-7xl mx-auto">
                <h2 className={`text-3xl md:text-4xl font-outfit font-bold text-center mb-16 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  What Our Users Say
                </h2>
                <div className="relative">
                  <div className="overflow-hidden">
                    <motion.div
                      animate={{ x: `-${activeTestimonial * 100}%` }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="flex"
                    >
                      {testimonials.map((testimonial, index) => (
                        <div
                          key={index}
                          className="w-full flex-shrink-0 px-4"
                        >
                          <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-white'} p-8 rounded-2xl backdrop-blur-sm`}>
                            <div className="flex items-center mb-6">
                              <img
                                src={testimonial.image}
                                alt={testimonial.name}
                                className="w-12 h-12 rounded-full mr-4"
                              />
                              <div>
                                <h3 className={`font-outfit font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {testimonial.name}
                                </h3>
                                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                  {testimonial.role}
                                </p>
                              </div>
                            </div>
                            <p className={`text-lg mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              "{testimonial.content}"
                            </p>
                            <div className="flex text-yellow-400">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <Star key={i} className="w-5 h-5 fill-current" />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                  <div className="flex justify-center mt-8 space-x-2">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveTestimonial(index)}
                        className={`w-3 h-3 rounded-full transition-colors ${
                          activeTestimonial === index
                            ? 'bg-purple-500'
                            : theme === 'dark' ? 'bg-white/20' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className={`py-20 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-background/50' : 'bg-white'}`}>
              <div className="max-w-3xl mx-auto">
                <h2 className={`text-3xl md:text-4xl font-outfit font-bold text-center mb-16 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <motion.div
                      key={index}
                      className={`${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'} rounded-lg overflow-hidden`}
                      initial={false}
                    >
                      <button
                        onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between"
                      >
                        <span className={`font-outfit font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {faq.question}
                        </span>
                        <ChevronRight
                          className={`w-5 h-5 transform transition-transform ${
                            activeFaq === index ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      <motion.div
                        initial={false}
                        animate={{
                          height: activeFaq === index ? 'auto' : 0,
                          opacity: activeFaq === index ? 1 : 0
                        }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <p className={`px-6 pb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {faq.answer}
                        </p>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            <section className={`py-20 px-4 sm:px-6 lg:px-8 ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'}`}>
              <div className="max-w-7xl mx-auto text-center">
                <h2 className={`text-3xl md:text-4xl font-outfit font-bold mb-16 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Seamless Integrations
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                  {integrations.map((integration, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`${
                        theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50'
                      } p-6 rounded-xl transition-colors duration-300`}
                    >
                      <div className="flex flex-col items-center">
                        {integration.icon}
                        <span className={`mt-2 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {integration.name}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            <footer className={`py-8 px-4 sm:px-6 lg:px-8 border-t ${
              theme === 'dark' ? 'border-white/10' : 'border-gray-200'
            }`}>
              <div className="max-w-7xl mx-auto text-center text-sm">
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  © 2025 Sarux AI. Developed by ASA Ltd. All rights reserved.
                </p>
              </div>
            </footer>

            <AnimatePresence>
              {showChat && (
                <ChatInterface 
                  onClose={() => setShowChat(false)}
                  isDarkMode={theme === 'dark'}
                  onThemeChange={toggleTheme}
                />
              )}
            </AnimatePresence>
          </div>
        }
      />
      <Route path="/early-access" element={<EarlyAccessForm />} />
    </Routes>
  );
}

export default App;