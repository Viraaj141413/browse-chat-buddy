import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Bot, Globe, Mic, MessageSquare, Play, CheckCircle, Eye, Settings } from "lucide-react";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <header className="border-b border-border/20 backdrop-blur-md bg-card/50">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/70 rounded-xl flex items-center justify-center">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              AI Browser Assistant
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Your Voice-Activated AI Assistant
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent block mt-2">
                That Browses the Web for You
              </span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Talk to it, and watch it live browse, order, and navigate—all in real time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="group bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all duration-300 text-lg px-8 py-6"
            >
              Get Started
              <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="border-primary/30 hover:border-primary text-lg px-8 py-6">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-24 bg-card/30 rounded-3xl my-16">
        <div className="text-center mb-20">
          <h3 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h3>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
            Three simple steps to revolutionary AI browsing
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-16 max-w-6xl mx-auto">
          <div className="text-center space-y-6 group">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary to-primary/70 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              1
            </div>
            <h4 className="text-2xl font-bold">Speak or type your request</h4>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Tell the AI what you want to accomplish on the web in natural language
            </p>
          </div>

          <div className="text-center space-y-6 group">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary to-primary/70 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              2
            </div>
            <h4 className="text-2xl font-bold">The AI understands and acts live on the web</h4>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Watch in real-time as AI navigates websites, fills forms, and completes tasks
            </p>
          </div>

          <div className="text-center space-y-6 group">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-primary to-primary/70 rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              3
            </div>
            <h4 className="text-2xl font-bold">Watch the live browser preview and confirm actions</h4>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Monitor every step and maintain control with pause, resume, and confirmation options
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-20">
          <h3 className="text-4xl md:text-5xl font-bold mb-6">Powerful Features</h3>
          <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
            Experience the next generation of human-AI collaboration with cutting-edge technology
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="group hover:shadow-xl transition-all duration-300 border-border/30 hover:border-primary/50">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary to-primary/70 rounded-2xl flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-primary-foreground" />
              </div>
              <h4 className="text-xl font-bold">Voice conversation powered by Gemini + ElevenLabs</h4>
              <p className="text-muted-foreground leading-relaxed">
                Natural voice interactions with state-of-the-art speech recognition and synthesis
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-border/30 hover:border-primary/50">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary to-primary/70 rounded-2xl flex items-center justify-center">
                <Eye className="h-8 w-8 text-primary-foreground" />
              </div>
              <h4 className="text-xl font-bold">Live browser automation preview</h4>
              <p className="text-muted-foreground leading-relaxed">
                Watch AI navigate websites in real-time with full transparency of every action
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-border/30 hover:border-primary/50">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary to-primary/70 rounded-2xl flex items-center justify-center">
                <Settings className="h-8 w-8 text-primary-foreground" />
              </div>
              <h4 className="text-xl font-bold">Pause, resume, and control AI anytime</h4>
              <p className="text-muted-foreground leading-relaxed">
                Maintain full control with intuitive pause/resume controls and action confirmations
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h3 className="text-4xl md:text-5xl font-bold">
              Ready to Experience the Future?
            </h3>
            <p className="text-muted-foreground text-xl">
              Join the revolution of AI-powered web interaction. Start browsing with voice commands today.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg text-lg px-8 py-6"
            >
              Start Chatting Now
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/70 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <h4 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  AI Browser
                </h4>
              </div>
              <p className="text-muted-foreground">
                The future of AI-powered web interaction, bringing voice commands and live browsing together.
              </p>
            </div>

            <div className="space-y-4">
              <h5 className="font-semibold text-lg">Product</h5>
              <div className="space-y-3 text-muted-foreground">
                <div>Features</div>
                <div>Pricing</div>
                <div>API Documentation</div>
                <div>Integrations</div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-semibold text-lg">Company</h5>
              <div className="space-y-3 text-muted-foreground">
                <div>About Us</div>
                <div>Contact</div>
                <div>Careers</div>
                <div>Blog</div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-semibold text-lg">Legal</h5>
              <div className="space-y-3 text-muted-foreground">
                <div>Privacy Policy</div>
                <div>Terms of Service</div>
                <div>Cookie Policy</div>
                <div>Disclaimer</div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/20 mt-12 pt-8 text-center">
            <p className="text-muted-foreground">
              © 2024 AI Browser Assistant. All rights reserved. This AI assistant handles web browsing automatically. Please review actions before confirming sensitive operations.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};