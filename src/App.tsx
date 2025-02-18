import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Code, Image, MessageSquareText, Shield, Zap, ChevronRight } from 'lucide-react';
import ParticleBackground from './components/ParticleBackground';
import Button from './components/Button';
import ChatInterface from './components/ChatInterface';

function App() {
  const [heroRef, heroInView] = useInView({ triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [techRef, techInView] = useInView({ triggerOnce: true, threshold: 0.2 });
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">
      <ParticleBackground />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-purple-500" />
              <span className="font-outfit font-bold text-xl">Sarux AI</span>
            </div>
            <Button variant="secondary" size="sm">
              Get Early Access
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        initial={{ opacity: 0, y: 20 }}
        animate={heroInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 hero-gradient"
      >
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-outfit font-bold text-4xl md:text-6xl lg:text-7xl mb-6 gradient-text">
            Redefining the Boundaries of Artificial Intelligence
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10">
            Experience the next evolution in AI technology with unparalleled code generation,
            image creation, and intelligent prompt enhancement.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg">
              Get Early Access <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setShowChat(true)}>
              Try Demo
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        ref={featuresRef}
        initial={{ opacity: 0, y: 40 }}
        animate={featuresInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-outfit font-bold text-center mb-16">
            Key Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                className="card-gradient p-8 rounded-2xl backdrop-blur-sm"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-outfit font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Technical Section */}
      <motion.section
        ref={techRef}
        initial={{ opacity: 0, y: 40 }}
        animate={techInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background/50 to-background"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-outfit font-bold mb-6">
              Enterprise-Grade Security
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Built with security at its core, Sarux AI implements industry-leading
              protection measures to keep your data safe.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Shield className="w-6 h-6" />, title: "End-to-End Encryption" },
              { icon: <Zap className="w-6 h-6" />, title: "Real-time Monitoring" },
              { icon: <Shield className="w-6 h-6" />, title: "Access Control" },
              { icon: <Shield className="w-6 h-6" />, title: "Data Privacy" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={techInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 mb-4">
                  {item.icon}
                </div>
                <h3 className="font-outfit font-semibold">{item.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-400">
          <p>© 2025 Sarux AI. Developed by ASA Ltd. All rights reserved.</p>
        </div>
      </footer>

      {/* Chat Interface */}
      <AnimatePresence>
        {showChat && <ChatInterface onClose={() => setShowChat(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default App;