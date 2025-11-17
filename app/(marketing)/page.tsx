
/**
 * Mindous.ai Landing Page
 * Multi-LLM AI Agent Orchestration Platform
 * Showcases intelligent routing across multiple AI providers
 */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, Github, Twitter, Zap, Shield, TrendingUp, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import MultiLLMHero from "./components/multi-llm-hero";
import LLMProvidersSection from "./components/llm-providers-section";

// Key features highlighting multi-LLM capabilities
const features = [
  {
    icon: Brain,
    title: "Intelligent Task Orchestration",
    description: "Break down complex tasks into optimized subtasks, each routed to the best-suited LLM provider for maximum efficiency and quality results.",
    benefits: ["Automatic task decomposition", "Smart provider selection", "Real-time optimization"]
  },
  {
    icon: Zap,
    title: "Multi-Provider Routing Engine",
    description: "Our sophisticated routing algorithm considers performance, cost, and capability metrics to select the optimal AI model for each subtask.",
    benefits: ["5+ LLM providers supported", "Real-time performance monitoring", "Automatic failover handling"]
  },
  {
    icon: TrendingUp,
    title: "Performance & Cost Analytics",
    description: "Track usage, performance, and costs across all LLM providers with detailed analytics and optimization recommendations.",
    benefits: ["Cost optimization insights", "Performance comparisons", "Usage analytics dashboard"]
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Reliability",
    description: "Built-in circuit breakers, fallback mechanisms, and monitoring ensure your AI workflows never fail, even when individual providers do.",
    benefits: ["99.9% uptime guarantee", "Automatic provider fallbacks", "Real-time health monitoring"]
  }
];

// Customer testimonials focused on multi-LLM benefits
const testimonials = [
  {
    name: "Sarah Chen",
    title: "CTO, TechFlow Solutions",
    content: "Mindous.ai reduced our AI costs by 65% while improving output quality. The intelligent routing is game-changing – we get Claude's writing quality for content and GPT-4's speed for code, automatically.",
    rating: 5,
    company: "TechFlow Solutions"
  },
  {
    name: "Marcus Rodriguez",
    title: "Lead Developer, DataSync",
    content: "Having access to multiple LLM providers through one platform is incredible. When OpenAI was down last month, our workflows continued seamlessly using Anthropic and Google models.",
    rating: 5,
    company: "DataSync"
  },
  {
    name: "Dr. Emily Watson",
    title: "Research Director, AI Labs",
    content: "The task decomposition and real-time monitoring changed how we approach complex AI projects. We can see exactly which model handles each subtask and optimize accordingly.",
    rating: 5,
    company: "AI Labs"
  }
];

// Stats showcasing platform capabilities
const stats = [
  { number: "5+", label: "AI Providers", description: "Including Abacus, OpenAI, Anthropic, Google, Qwen" },
  { number: "65%", label: "Cost Reduction", description: "Average savings through intelligent routing" },
  { number: "10x", label: "Faster Execution", description: "Parallel processing across multiple models" },
  { number: "99.9%", label: "Uptime", description: "Enterprise-grade reliability with failovers" }
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Multi-LLM Hero Section */}
      <MultiLLMHero />

      {/* Stats Section */}
      <section className="py-16 px-4 md:px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Trusted by 500+ Organizations
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Proven Results Across Industries
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-lg font-semibold mb-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LLM Providers Section */}
      <LLMProvidersSection />

      {/* Features Section */}
      <section className="py-20 px-4 md:px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Brain className="h-3 w-3 mr-1" />
              Advanced AI Orchestration
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Multi-LLM Orchestration?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Single-provider AI solutions are limited. Our platform harnesses the unique strengths 
              of each AI model to deliver superior results at lower costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card key={feature.title} className="hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="h-4 w-4 text-green-500" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 md:px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Users className="h-3 w-3 mr-1" />
              Customer Success Stories
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Loved by Developers & Enterprises
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how organizations are transforming their AI workflows with multi-LLM orchestration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: testimonial.rating }, (_, i) => (
                      <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full" />
                    ))}
                  </div>
                  <CardDescription className="text-base leading-relaxed italic">
                    &ldquo;{testimonial.content}&rdquo;
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-t pt-4">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.title}</div>
                    <div className="text-sm text-blue-600">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your AI Workflows?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers and enterprises using Mindous.ai to orchestrate 
            intelligent AI workflows across multiple LLM providers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href="/dashboard">
                Start Free Multi-LLM Workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="#contact">
                Contact Sales
              </Link>
            </Button>
          </div>
          
          <p className="text-blue-100 text-sm mt-6">
            No credit card required • 5 AI providers included • Enterprise support available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-400" />
                Mindous.ai
              </h3>
              <p className="text-gray-400 max-w-md mb-6">
                The leading multi-LLM orchestration platform. Intelligently route tasks across 
                Abacus AI, OpenAI, Anthropic, Google, Qwen, and more for optimal performance and cost efficiency.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="icon" asChild className="text-gray-400 hover:text-white">
                  <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                    <Github className="h-5 w-5" />
                    <span className="sr-only">GitHub</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="text-gray-400 hover:text-white">
                  <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-5 w-5" />
                    <span className="sr-only">Twitter</span>
                  </Link>
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-3">
                <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Multi-LLM Workspace</Link></li>
                <li><Link href="/dashboard/analytics" className="text-gray-400 hover:text-white transition-colors">Performance Analytics</Link></li>
                <li><Link href="/dashboard/tasks" className="text-gray-400 hover:text-white transition-colors">Task Management</Link></li>
                <li><Link href="/dashboard/tools" className="text-gray-400 hover:text-white transition-colors">Tool Registry</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">AI Providers</h3>
              <ul className="space-y-3">
                <li><span className="text-gray-400">Abacus AI Integration</span></li>
                <li><span className="text-gray-400">OpenAI GPT Models</span></li>
                <li><span className="text-gray-400">Anthropic Claude</span></li>
                <li><span className="text-gray-400">Google Gemini</span></li>
                <li><span className="text-gray-400">Qwen Models</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Mindous.ai. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-400 text-sm hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 text-sm hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/security" className="text-gray-400 text-sm hover:text-white transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
