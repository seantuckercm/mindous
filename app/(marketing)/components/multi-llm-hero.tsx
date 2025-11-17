
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ProviderBadge, LLMProvider } from '@/components/llm/provider-badge';
import { ArrowRight, Sparkles, Zap, Brain, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const supportedProviders: { provider: LLMProvider; description: string }[] = [
  { provider: 'abacus', description: 'Advanced AI Platform' },
  { provider: 'openai', description: 'GPT-4 & GPT-4o Models' },
  { provider: 'anthropic', description: 'Claude 3.5 Series' },
  { provider: 'google', description: 'Gemini 1.5 Pro' },
  { provider: 'qwen', description: 'Qwen Max Models' }
];

const features = [
  {
    icon: Brain,
    title: 'Intelligent Routing',
    description: 'Automatically selects the best LLM for each subtask based on performance, cost, and capabilities'
  },
  {
    icon: Zap,
    title: 'Real-time Execution',
    description: 'Watch your tasks decompose and execute across multiple AI providers with live progress updates'
  },
  {
    icon: TrendingUp,
    title: 'Cost Optimization',
    description: 'Smart routing reduces costs by up to 60% while maintaining high-quality results'
  }
];

export default function MultiLLMHero() {
  const [currentProvider, setCurrentProvider] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentProvider((prev) => (prev + 1) % supportedProviders.length);
        setIsAnimating(false);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge variant="outline" className="px-3 py-1">
                <Sparkles className="h-3 w-3 mr-1" />
                Multi-LLM AI Orchestration Platform
              </Badge>
            </motion.div>

            {/* Headline */}
            <div className="space-y-4">
              <motion.h1 
                className="text-4xl lg:text-6xl font-bold tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Orchestrate Complex Tasks Across{' '}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Multiple AI Models
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-muted-foreground max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Mindous.ai intelligently routes each subtask to the optimal LLM provider—whether it&apos;s Abacus AI, ChatGPT, Claude, Gemini, or Qwen—ensuring peak performance and cost efficiency.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/dashboard">
                  Start Multi-LLM Workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" asChild>
                <Link href="#features">
                  Learn More
                </Link>
              </Button>
            </motion.div>

            {/* Quick Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-4 pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">5+</div>
                <div className="text-sm text-muted-foreground">LLM Providers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">60%</div>
                <div className="text-sm text-muted-foreground">Cost Savings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">10x</div>
                <div className="text-sm text-muted-foreground">Faster Execution</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Animated Provider Showcase */}
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-2">
              <CardContent className="p-0 space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Supported AI Providers</h3>
                  <p className="text-sm text-muted-foreground">
                    Intelligent routing across leading LLM providers
                  </p>
                </div>

                {/* Rotating Provider Display */}
                <div className="relative h-20 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentProvider}
                      initial={{ opacity: 0, scale: 0.8, rotateX: -90 }}
                      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                      exit={{ opacity: 0, scale: 0.8, rotateX: 90 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 flex flex-col items-center justify-center"
                    >
                      <ProviderBadge 
                        provider={supportedProviders[currentProvider].provider} 
                        size="lg"
                        className="mb-2"
                      />
                      <p className="text-sm text-muted-foreground text-center">
                        {supportedProviders[currentProvider].description}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Provider Grid */}
                <div className="grid grid-cols-5 gap-2">
                  {supportedProviders.map((provider, index) => (
                    <motion.div
                      key={provider.provider}
                      className={`p-2 rounded-lg border transition-all ${
                        index === currentProvider 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                      animate={{ 
                        scale: index === currentProvider ? 1.05 : 1,
                        opacity: index === currentProvider ? 1 : 0.6 
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <ProviderBadge 
                        provider={provider.provider} 
                        size="sm" 
                        showIcon={true}
                      />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Features Cards */}
            <div className="grid gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + (index * 0.1) }}
                >
                  <Card className="p-4 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-0">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg group-hover:from-blue-200 group-hover:to-purple-200 transition-all">
                          <feature.icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
