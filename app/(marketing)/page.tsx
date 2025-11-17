
/**
 * Mindous.ai Landing Page
 * AI Task Execution Platform
 * Build, analyze, and automate with transparent AI assistance
 */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, Github, Twitter, Zap, Shield, Eye, Code, ChevronRight } from "lucide-react";
import Link from "next/link";

// Key features highlighting transparency and execution
const features = [
  {
    icon: Eye,
    title: "Real-Time Transparency",
    description: "See exactly what your AI agent is doing at every step. Watch tools being used, files being created, and progress being made in real-time.",
    benefits: ["Live execution monitoring", "Tool usage visibility", "Step-by-step progress tracking"]
  },
  {
    icon: Code,
    title: "Intelligent Task Execution",
    description: "Break down complex tasks automatically and execute them efficiently. From code generation to data analysis, handle any task with ease.",
    benefits: ["Automatic task breakdown", "Multi-step workflows", "Smart tool selection"]
  },
  {
    icon: Zap,
    title: "Powerful Integrations",
    description: "Built-in access to browsers, terminals, code editors, file systems, and more. Your AI agent has all the tools it needs to get work done.",
    benefits: ["Terminal access", "Browser automation", "File operations", "Code execution"]
  },
  {
    icon: Shield,
    title: "Enterprise-Grade Reliability",
    description: "Production-ready infrastructure with monitoring, error handling, and audit trails. Trust your critical workflows to Mindous.ai.",
    benefits: ["99.9% uptime", "Complete audit logs", "Error recovery"]
  }
];

// Customer testimonials focused on transparency and productivity
const testimonials = [
  {
    name: "Sarah Chen",
    title: "CTO, TechFlow Solutions",
    content: "The real-time visibility into what the AI is doing completely changed how we trust and use AI agents. We can see every file edit, every command run, every decision made.",
    rating: 5,
    company: "TechFlow Solutions"
  },
  {
    name: "Marcus Rodriguez",
    title: "Lead Developer, DataSync",
    content: "Building applications with Mindous.ai is incredible. The AI handles everything from setup to deployment, and I can watch and intervene at any point. It's like pair programming with an expert.",
    rating: 5,
    company: "DataSync"
  },
  {
    name: "Dr. Emily Watson",
    title: "Research Director, AI Labs",
    content: "The transparency and audit trails are essential for our research. We can reproduce results, understand the reasoning, and trust the AI's work completely.",
    rating: 5,
    company: "AI Labs"
  }
];

// Stats showcasing platform capabilities
const stats = [
  { number: "50+", label: "Built-in Tools", description: "From code editors to browsers" },
  { number: "100%", label: "Transparency", description: "See every step in real-time" },
  { number: "10x", label: "Faster", description: "Automate complex workflows" },
  { number: "99.9%", label: "Uptime", description: "Enterprise-grade reliability" }
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 md:px-6 lg:py-32 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-hidden">
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 text-base py-2 px-4">
              <Brain className="h-4 w-4 mr-2" />
              AI-Powered Workspace
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Build Anything with AI
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Mindous.ai is your intelligent AI assistant that helps you build applications, 
              analyze data, automate workflows, and solve complex problems—all through 
              natural conversation with complete transparency.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6">
                <Link href="/dashboard">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button asChild size="lg" variant="outline" className="text-lg px-8 py-6">
                <Link href="#features">
                  Learn More
                </Link>
              </Button>
            </div>
            
            <p className="text-gray-500 text-sm">
              No credit card required • Start building instantly • Enterprise support available
            </p>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-10 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 md:px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Trusted by Developers Worldwide
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Powerful AI, Complete Transparency
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">{stat.number}</div>
                <div className="text-lg font-semibold mb-1">{stat.label}</div>
                <div className="text-sm text-muted-foreground">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 md:px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Eye className="h-3 w-3 mr-1" />
              Transparency First
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Mindous.ai?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Traditional AI tools are black boxes. We believe in complete transparency—see exactly 
              what your AI agent is doing at every step, from planning to execution.
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
              <Brain className="h-3 w-3 mr-1" />
              Trusted by Developers
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Build Better, Build Faster
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how teams are using Mindous.ai to accelerate development and automate complex workflows
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
            Ready to Build with AI?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join developers and teams using Mindous.ai to build applications, automate workflows, 
            and solve complex problems with complete transparency.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href="/dashboard">
                Start Building Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Link href="#features">
                View Features
              </Link>
            </Button>
          </div>
          
          <p className="text-blue-100 text-sm mt-6">
            No credit card required • Start instantly • Full transparency guaranteed
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-400" />
                Mindous.ai
              </h3>
              <p className="text-gray-400 max-w-md mb-6">
                Your intelligent AI workspace for building applications, automating workflows, 
                and solving complex problems. Experience complete transparency in every task 
                with real-time execution visibility.
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
                <li><Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Workspace</Link></li>
                <li><Link href="/dashboard/analytics" className="text-gray-400 hover:text-white transition-colors">Analytics</Link></li>
                <li><Link href="/dashboard/tasks" className="text-gray-400 hover:text-white transition-colors">Tasks</Link></li>
                <li><Link href="/dashboard/settings" className="text-gray-400 hover:text-white transition-colors">Settings</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-3">
                <li><span className="text-gray-400">Real-time Monitoring</span></li>
                <li><span className="text-gray-400">Tool Visibility</span></li>
                <li><span className="text-gray-400">Task Automation</span></li>
                <li><span className="text-gray-400">Code Generation</span></li>
                <li><span className="text-gray-400">Data Analysis</span></li>
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
