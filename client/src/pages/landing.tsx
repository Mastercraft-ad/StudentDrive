import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Award, TrendingUp, Users, CheckCircle, BarChart3, Sparkles, Zap, Target, Upload, Brain, Trophy, FileText, MessageSquare, Map, GraduationCap, ChevronDown, Star, Menu, X, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import heroImage from "@assets/students-studying-together-medium-shot_1761445909836.jpg";
import logoImg from "@assets/StudentDrive logo_1762056464003.png";

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setMobileMenuOpen(false);
    }
  };

  const testimonials = [
    {
      text: "StudentDrive has completely transformed how I study. The organized materials and quizzes helped me ace my exams!",
      name: "Sarah Chen",
      role: "Medical Student"
    },
    {
      text: "As an instructor, I love how easy it is to share materials and track student progress. The analytics are invaluable.",
      name: "Dr. Michael Johnson",
      role: "Computer Science Professor"
    },
    {
      text: "The performance tracking feature helped me identify my weak areas and improve my grades significantly.",
      name: "James Rodriguez",
      role: "Engineering Student"
    },
    {
      text: "This platform is exactly what our institution needed. The management tools are comprehensive and user-friendly.",
      name: "Prof. Emily Watson",
      role: "Department Head"
    },
    {
      text: "I can access all my study materials from anywhere. The bookmarking feature is a game-changer!",
      name: "Aisha Mohammed",
      role: "Business Student"
    },
    {
      text: "The quiz system with instant feedback has made learning so much more engaging and effective.",
      name: "David Kim",
      role: "Law Student"
    }
  ];

  const faqs = [
    {
      question: "How does StudentDrive help me study better?",
      answer: "StudentDrive provides organized access to verified study materials, interactive quizzes, and performance analytics that help you track your progress and identify areas for improvement."
    },
    {
      question: "Can I upload my own study materials?",
      answer: "Yes! Students and instructors can upload study materials including lecture notes, textbooks, study guides, and past questions. All uploads are verified to ensure quality."
    },
    {
      question: "How do the quizzes work?",
      answer: "Our interactive quiz system allows you to practice with course-specific questions, get instant feedback, and track your improvement over time with detailed analytics."
    },
    {
      question: "Is StudentDrive suitable for institutions?",
      answer: "Absolutely! We offer comprehensive tools for institutions to manage students and instructors, track departmental analytics, and maintain custom branding."
    },
    {
      question: "What file formats are supported?",
      answer: "We support common document formats including PDF, DOCX, images (PNG, JPG), and text files. Files can be viewed directly in your browser."
    },
    {
      question: "How is my data protected?",
      answer: "We use industry-standard encryption for all data, secure authentication, and role-based access control to ensure your information is safe and private."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src={logoImg} 
                alt="StudentDrive Logo" 
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-heading font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">StudentDrive</span>
            </div>

            {/* Desktop Navigation Menu */}
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Testimonials
              </button>
              <a 
                href="/blog"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Blog
              </a>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                FAQ
              </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button 
                asChild 
                data-testid="button-login" 
                variant="ghost"
                className="text-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 font-semibold"
              >
                <a href="/login">Sign In</a>
              </Button>
              <Button 
                asChild 
                data-testid="button-get-started-header" 
                className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold px-6"
              >
                <a href="/register">Get Started</a>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border/50">
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left py-2"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left py-2"
                >
                  How It Works
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left py-2"
                >
                  Testimonials
                </button>
                <a 
                  href="/blog"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Blog
                </a>
                <button 
                  onClick={() => scrollToSection('faq')}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left py-2"
                >
                  FAQ
                </button>
                <div className="pt-3 flex flex-col gap-2">
                  <Button 
                    asChild 
                    variant="ghost"
                    className="justify-start"
                  >
                    <a href="/login">Sign In</a>
                  </Button>
                  <Button 
                    asChild 
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <a href="/register">Get Started</a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
            {/* Left Column - Content */}
            <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-heading font-bold text-foreground mb-4 sm:mb-6 leading-tight">
                Achieve your academic goals with{" "}
                <span className="text-primary">StudentDrive</span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                Access verified study materials, interactive quizzes, and performance analytics from world-class educational resources.
              </p>

              {/* Pricing Info */}
              <p className="text-sm sm:text-base text-foreground/80 mb-6 sm:mb-8 font-medium">
                Free to start • Unlimited access to 50,000+ materials
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8 justify-center lg:justify-start">
                <Button 
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm sm:text-base px-6 py-2.5 rounded-lg" 
                  asChild 
                  data-testid="button-get-started"
                >
                  <a href="/register">Start Free Today</a>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto border-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold text-sm sm:text-base px-6 py-2.5 rounded-lg transition-all duration-200" 
                  data-testid="button-sign-in"
                  asChild
                >
                  <a href="/login">Sign In</a>
                </Button>
              </div>

              {/* Guarantee Text */}
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">
                or explore with a{" "}
                <span className="text-primary font-semibold">guest account</span>{" "}
                • no credit card required
              </p>

              {/* Trust Indicators */}
              <div className="pt-6 sm:pt-8 border-t border-border/50">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">10,000+ Students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">50,000+ Resources</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-[#fbbf24] fill-[#fbbf24] flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">4.8/5 Rating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Students Studying Image */}
            <div className="relative h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px] flex items-center justify-center mt-8 lg:mt-0">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroImage} 
                  alt="Students studying together" 
                  className="w-full h-full object-cover"
                />
                {/* Overlay gradient for better text visibility if needed */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                {/* Stats Card - Floating on Image */}
                <div className="absolute bottom-6 right-6 bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-xl border border-border/50">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-foreground">95%</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">Success Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 mb-4">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Learn Smarter</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              How StudentDrive Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your study materials into an interactive learning experience in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 shadow-lg relative">
                  <Upload className="h-10 w-10 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                    <span className="text-primary font-bold text-lg">1</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">Upload Materials</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Upload your lecture notes, textbooks, or study guides in any common format. Our platform processes them instantly.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center mb-6 shadow-lg relative">
                  <Brain className="h-10 w-10 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                    <span className="text-[#0ea5e9] font-bold text-lg">2</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">Access & Organize</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Browse organized materials by course and topic. Bookmark favorites and access them anytime, anywhere.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center mb-6 shadow-lg relative">
                  <Trophy className="h-10 w-10 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                    <span className="text-[#8b5cf6] font-bold text-lg">3</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3">Track Progress</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Take interactive quizzes and monitor your performance with detailed analytics to achieve academic excellence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Study Smarter</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Everything you need for effective learning
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform any study material into an interactive learning experience with our comprehensive platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Resource Library */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">Smart Resource Library</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Access verified lecture notes, textbooks, study guides, and past questions organized by course and topic. Search and filter materials with advanced options.
                    </p>
                    <a href="/register" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
                      Learn more →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Quizzes */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-[#0ea5e9]/30 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">Practice Quizzes</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Generate customized practice tests that adapt to your progress. Get instant feedback and track your improvement with detailed analytics.
                    </p>
                    <a href="/register" className="text-[#0ea5e9] font-semibold hover:underline inline-flex items-center gap-1">
                      Learn more →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Analytics */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-[#8b5cf6]/30 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">Visual Analytics</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Track your academic performance with detailed charts and insights. Identify strengths and areas for improvement with data-driven recommendations.
                    </p>
                    <a href="/register" className="text-[#8b5cf6] font-semibold hover:underline inline-flex items-center gap-1">
                      Learn more →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collaboration */}
            <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-[#f59e0b]/30 overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">Collaborative Learning</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Share materials with classmates, bookmark favorite resources, and engage with a community of learners and educators.
                    </p>
                    <a href="/register" className="text-[#f59e0b] font-semibold hover:underline inline-flex items-center gap-1">
                      Learn more →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Role-Based Benefits */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 mb-4">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">For Everyone</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Built for Every Learning Role
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group border-2 border-[#8b5cf6]/20 hover:border-[#8b5cf6]/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Students</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#8b5cf6] mt-0.5 flex-shrink-0" />
                    <span>Access learning materials anytime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#8b5cf6] mt-0.5 flex-shrink-0" />
                    <span>Track progress and achievements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#8b5cf6] mt-0.5 flex-shrink-0" />
                    <span>Bookmark favorite resources</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group border-2 border-[#f59e0b]/20 hover:border-[#f59e0b]/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Instructors</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#f59e0b] mt-0.5 flex-shrink-0" />
                    <span>Upload and share materials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#f59e0b] mt-0.5 flex-shrink-0" />
                    <span>Create custom quizzes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#f59e0b] mt-0.5 flex-shrink-0" />
                    <span>Monitor student performance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="group border-2 border-[#10b981]/20 hover:border-[#10b981]/50 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">Institutions</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Manage students and instructors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Track departmental analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#10b981] mt-0.5 flex-shrink-0" />
                    <span>Custom branding options</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 mb-4">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Testimonials</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              What users say
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From intuitive study tools to comprehensive analytics, StudentDrive has become an essential platform for today's learners
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#fbbf24] text-[#fbbf24]" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 mb-4">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">FAQ</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Common questions from our users
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-2 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-0">
                  <button
                    className="w-full text-left p-6 flex items-center justify-between gap-4"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <h3 className="font-semibold text-lg">{faq.question}</h3>
                    <ChevronDown 
                      className={`h-5 w-5 text-primary flex-shrink-0 transition-transform duration-300 ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-[#0ea5e9]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Ready to Transform Your Study Experience?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join thousands of students and educators already using StudentDrive to achieve their academic goals
          </p>
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 border-0 shadow-xl hover:shadow-2xl transition-all duration-200 text-lg px-12 py-7 h-auto font-semibold rounded-lg" 
            asChild 
            data-testid="button-cta"
          >
            <a href="/register">Get Started for Free</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* About Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
                  <BookOpen className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-lg font-heading font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">StudentDrive</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Empowering students and educators with intelligent learning tools for academic success.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@studentdrive.com</span>
              </div>
            </div>

            {/* Features Column */}
            <div>
              <h3 className="font-heading font-bold text-foreground mb-4">Features</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Resource Library
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Interactive Quizzes
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Performance Analytics
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Collaborative Learning
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h3 className="font-heading font-bold text-foreground mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => scrollToSection('how-it-works')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('testimonials')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Testimonials
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('faq')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    FAQ
                  </button>
                </li>
                <li>
                  <a href="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Get Started
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="font-heading font-bold text-foreground mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Sign In
                  </a>
                </li>
                <li>
                  <a href="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Register
                  </a>
                </li>
                <li>
                  <span className="text-sm text-muted-foreground">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-sm text-muted-foreground">Terms of Service</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © 2025 StudentDrive. All rights reserved. Empowering students everywhere.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
