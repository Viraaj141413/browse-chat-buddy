import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Bot, Globe, Mic, MicOff, Pause, Play } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary animate-pulse-glow" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI Browser
            </h1>
          </div>
          <Button variant="outline" onClick={onGetStarted}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl font-bold">
              The Future of
              <span className="bg-gradient-primary bg-clip-text text-transparent block">
                AI Web Interaction
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Watch AI browse the web in real-time. Give voice commands and observe 
              as our advanced AI navigates, clicks, and completes tasks on any website 
              while you watch every step unfold.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="group bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              Start Browsing with AI
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="border-primary/50 hover:border-primary">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-4">Revolutionary AI Capabilities</h3>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Experience the next generation of human-AI collaboration through live browser control
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="group hover:shadow-glow-accent transition-all duration-300 animate-float border-border/50">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                <Mic className="h-8 w-8 text-primary-foreground" />
              </div>
              <h4 className="text-xl font-semibold">Voice Commands</h4>
              <p className="text-muted-foreground">
                Simply speak your requests and watch the AI understand and execute complex web tasks
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-glow-accent transition-all duration-300 animate-float border-border/50" style={{animationDelay: '1s'}}>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                <Globe className="h-8 w-8 text-primary-foreground" />
              </div>
              <h4 className="text-xl font-semibold">Live Browser Control</h4>
              <p className="text-muted-foreground">
                Watch in real-time as AI navigates websites, fills forms, and completes tasks
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-glow-accent transition-all duration-300 animate-float border-border/50" style={{animationDelay: '2s'}}>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary-foreground" />
              </div>
              <h4 className="text-xl font-semibold">Intelligent Conversation</h4>
              <p className="text-muted-foreground">
                Engage in natural dialogue while maintaining full control over AI actions
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-4">How It Works</h3>
          <p className="text-muted-foreground text-lg">
            Three simple steps to revolutionary AI browsing
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
              1
            </div>
            <h4 className="text-lg font-semibold">Speak or Type</h4>
            <p className="text-muted-foreground">
              Tell the AI what you want to accomplish on the web
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
              2
            </div>
            <h4 className="text-lg font-semibold">Watch Live Action</h4>
            <p className="text-muted-foreground">
              Observe the AI browse and interact with websites in real-time
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
              3
            </div>
            <h4 className="text-lg font-semibold">Control & Adjust</h4>
            <p className="text-muted-foreground">
              Pause, resume, or redirect the AI anytime during the process
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h3 className="text-4xl font-bold">
              Ready to Experience the Future?
            </h3>
            <p className="text-muted-foreground text-lg">
              Join the revolution of AI-powered web interaction. Start browsing with voice commands today.
            </p>
            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="bg-gradient-primary hover:shadow-glow"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};