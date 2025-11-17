
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProviderBadge, LLMProvider } from '@/components/llm/provider-badge';
import { CheckCircle, Zap, Brain, Star, Bot, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProviderFeature {
  provider: LLMProvider;
  name: string;
  models: string[];
  strengths: string[];
  bestFor: string[];
  performance: {
    speed: 'fast' | 'medium' | 'slow';
    cost: 'low' | 'medium' | 'high';
    quality: number; // 1-5 rating
  };
  description: string;
}

const providers: ProviderFeature[] = [
  {
    provider: 'abacus',
    name: 'Abacus AI',
    models: ['GPT-4', 'GPT-4 Turbo', 'Custom Models'],
    strengths: ['Advanced Analytics', 'Enterprise AI', 'Custom Solutions'],
    bestFor: ['Complex Analysis', 'Enterprise Tasks', 'Custom Workflows'],
    performance: { speed: 'medium', cost: 'medium', quality: 5 },
    description: 'Enterprise-grade AI platform with advanced analytics and custom model capabilities'
  },
  {
    provider: 'openai',
    name: 'ChatGPT (OpenAI)',
    models: ['GPT-4o', 'GPT-4o Mini', 'GPT-4 Turbo'],
    strengths: ['General Purpose', 'Code Generation', 'Fast Response'],
    bestFor: ['Code Tasks', 'General Writing', 'Quick Responses'],
    performance: { speed: 'fast', cost: 'low', quality: 4 },
    description: 'Most popular and versatile AI assistant with excellent code generation capabilities'
  },
  {
    provider: 'anthropic',
    name: 'Claude (Anthropic)',
    models: ['Claude 3.5 Sonnet', 'Claude 3 Opus', 'Claude 3 Haiku'],
    strengths: ['Safety First', 'Long Context', 'Thoughtful Analysis'],
    bestFor: ['Content Writing', 'Research', 'Ethical AI'],
    performance: { speed: 'medium', cost: 'medium', quality: 5 },
    description: 'AI assistant focused on helpfulness, harmlessness, and honesty with exceptional writing skills'
  },
  {
    provider: 'google',
    name: 'Gemini (Google)',
    models: ['Gemini 1.5 Pro', 'Gemini 1.5 Flash', 'Gemini Ultra'],
    strengths: ['Multimodal', 'Large Context', 'Google Integration'],
    bestFor: ['Research', 'Multimodal Tasks', 'Large Documents'],
    performance: { speed: 'medium', cost: 'medium', quality: 4 },
    description: 'Multimodal AI with exceptional context length and Google ecosystem integration'
  },
  {
    provider: 'qwen',
    name: 'Qwen (Alibaba)',
    models: ['Qwen-Max', 'Qwen-Plus', 'Qwen-Turbo'],
    strengths: ['Innovation', 'Efficiency', 'Multi-language'],
    bestFor: ['Diverse Tasks', 'Innovation', 'Global Applications'],
    performance: { speed: 'fast', cost: 'low', quality: 4 },
    description: 'Innovative AI models with strong multilingual capabilities and efficient performance'
  }
];

const getPerformanceColor = (level: string, metric: 'speed' | 'cost' | 'quality') => {
  if (metric === 'cost') {
    return level === 'low' ? 'text-green-600' : level === 'medium' ? 'text-yellow-600' : 'text-red-600';
  }
  return level === 'fast' || level === 'high' ? 'text-green-600' : 
         level === 'medium' ? 'text-yellow-600' : 'text-red-600';
};

const getQualityStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star 
      key={i} 
      className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
    />
  ));
};

export default function LLMProvidersSection() {
  return (
    <section className="py-20 px-4 md:px-6 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Powered by Leading AI Providers
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Mindous.ai intelligently orchestrates tasks across multiple LLM providers, automatically selecting 
            the best model for each subtask based on performance, cost, and capabilities.
          </p>
        </motion.div>

        {/* Auto-Routing Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Intelligent Auto-Routing</h3>
                    <p className="text-muted-foreground">
                      Each subtask is automatically assigned to the optimal LLM provider for best results
                    </p>
                  </div>
                </div>
                <ProviderBadge provider="auto" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Provider Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {providers.map((provider, index) => (
            <motion.div
              key={provider.provider}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <ProviderBadge provider={provider.provider} size="lg" />
                    <div className="flex items-center gap-1">
                      {getQualityStars(provider.performance.quality)}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{provider.name}</CardTitle>
                  <CardDescription>{provider.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Models */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">Available Models</h5>
                    <div className="flex flex-wrap gap-1">
                      {provider.models.map((model) => (
                        <Badge key={model} variant="secondary" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Strengths */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">Key Strengths</h5>
                    <div className="space-y-1">
                      {provider.strengths.map((strength) => (
                        <div key={strength} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{strength}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Best For */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">Best For</h5>
                    <div className="flex flex-wrap gap-1">
                      {provider.bestFor.map((use) => (
                        <Badge key={use} variant="outline" className="text-xs">
                          {use}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <Zap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className={`font-medium ${getPerformanceColor(provider.performance.speed, 'speed')}`}>
                          {provider.performance.speed}
                        </div>
                        <div className="text-muted-foreground">Speed</div>
                      </div>
                      <div className="text-center">
                        <DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className={`font-medium ${getPerformanceColor(provider.performance.cost, 'cost')}`}>
                          {provider.performance.cost}
                        </div>
                        <div className="text-muted-foreground">Cost</div>
                      </div>
                      <div className="text-center">
                        <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <div className="font-medium text-blue-600">
                          {provider.performance.quality}/5
                        </div>
                        <div className="text-muted-foreground">Quality</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Routing Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Why Multi-LLM Orchestration?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Cost Optimization</h4>
                  <p className="text-sm text-muted-foreground">
                    Save up to 60% on AI costs by routing tasks to the most cost-effective provider
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Performance Optimization</h4>
                  <p className="text-sm text-muted-foreground">
                    Get the best results by matching each task to the most capable model
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold mb-2">Reliability</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatic fallbacks ensure your tasks complete even if one provider fails
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
