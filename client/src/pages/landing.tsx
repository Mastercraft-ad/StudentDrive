import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  CheckCircle, 
  BarChart3, 
  Sparkles, 
  ChevronDown, 
  Star, 
  Menu, 
  X, 
  ArrowRight,
  Building2,
  UserCircle,
  Calendar,
  CreditCard,
  Bell,
  FileText,
  Brain,
  Trophy,
  Target,
  Zap,
  Shield,
  Clock,
  Globe
} from "lucide-react";
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

  const smsFeatures = [
    {
      icon: Users,
      title: "Student & Staff Management",
      description: "Manage students, teachers, and staff with complete profiles, enrollment, and role-based access."
    },
    {
      icon: Calendar,
      title: "Attendance Tracking",
      description: "Track daily attendance by class and subject with detailed reports and analytics."
    },
    {
      icon: BarChart3,
      title: "Grade Management",
      description: "Record and manage grades by term and subject with automatic GPA calculations."
    },
    {
      icon: CreditCard,
      title: "Fee Collection",
      description: "Manage school fees, track payments, send reminders, and generate invoices."
    },
    {
      icon: Bell,
      title: "Announcements",
      description: "Send targeted announcements to students, parents, and staff with instant notifications."
    },
    {
      icon: UserCircle,
      title: "Parent Portal",
      description: "Give parents access to view their children's grades, attendance, and school updates."
    }
  ];

  const lmsFeatures = [
    {
      icon: FileText,
      title: "Resource Library",
      description: "Access thousands of study materials including notes, textbooks, and past questions."
    },
    {
      icon: Brain,
      title: "Interactive Quizzes",
      description: "Test your knowledge with adaptive quizzes and get instant feedback on your progress."
    },
    {
      icon: Trophy,
      title: "Progress Tracking",
      description: "Monitor your learning journey with detailed analytics and achievement badges."
    },
    {
      icon: Target,
      title: "Learning Paths",
      description: "Follow structured courses designed by experts to master any subject."
    },
    {
      icon: BookOpen,
      title: "Bookmarks & Notes",
      description: "Save your favorite materials and add personal notes for quick revision."
    },
    {
      icon: Globe,
      title: "Learn Anywhere",
      description: "Access your materials on any device, anytime, with offline support."
    }
  ];

  const testimonials = [
    {
      text: "StudentDrive has completely transformed how we manage our school. The attendance and grade systems save us hours every week.",
      name: "Mrs. Adebayo",
      role: "Principal, Lagos Academy",
      type: "school"
    },
    {
      text: "As a self-learner preparing for exams, the quiz system and organized materials helped me ace my tests!",
      name: "Sarah Chen",
      role: "Medical Student",
      type: "learner"
    },
    {
      text: "The parent portal keeps me informed about my children's progress. I love getting real-time updates on their attendance and grades.",
      name: "Mr. Johnson",
      role: "Parent of 3 students",
      type: "school"
    },
    {
      text: "The learning paths feature helped me structure my self-study. I went from confused to confident in just 3 months.",
      name: "James Rodriguez",
      role: "Engineering Student",
      type: "learner"
    },
    {
      text: "Managing 500+ students used to be chaotic. Now with StudentDrive, everything is organized and accessible.",
      name: "Dr. Okonkwo",
      role: "School Administrator",
      type: "school"
    },
    {
      text: "The performance analytics showed me exactly where I needed to improve. My grades jumped from C to A in one semester.",
      name: "Aisha Mohammed",
      role: "Business Student",
      type: "learner"
    }
  ];

  const faqs = [
    {
      question: "What's the difference between the School System and Learning Platform?",
      answer: "The School Management System (SMS) is designed for educational institutions to manage students, staff, attendance, grades, and fees. The Learning Platform (LMS) is for individual learners who want to access study materials, take quizzes, and track their own learning progress."
    },
    {
      question: "How much does the School Management System cost?",
      answer: "We offer a 14-day free trial for schools. After that, pricing starts based on the number of students. Contact us for a custom quote that fits your institution's needs."
    },
    {
      question: "Is the Learning Platform free for individual learners?",
      answer: "Yes! Individual learners can sign up for free and access a wide range of study materials and quizzes. Premium features like advanced analytics and certificates are available with a subscription."
    },
    {
      question: "Can parents access their children's information?",
      answer: "Absolutely! Schools using our SMS can give parents dedicated login access to view their children's attendance, grades, fee status, and school announcements."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use industry-standard encryption and security practices. All data is stored securely with regular backups, and we comply with data protection regulations."
    },
    {
      question: "Can I use StudentDrive on mobile?",
      answer: "Yes! StudentDrive is fully responsive and works on all devices - desktop, tablet, and mobile. Access your school portal or learning materials from anywhere."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img 
                src={logoImg} 
                alt="StudentDrive Logo" 
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-heading font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">StudentDrive</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => scrollToSection('products')}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                data-testid="nav-products"
              >
                Products
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                data-testid="nav-features"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                data-testid="nav-testimonials"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                data-testid="nav-faq"
              >
                FAQ
              </button>
            </div>

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

            <button
              className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border/50">
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => scrollToSection('products')}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left py-2"
                  data-testid="nav-mobile-products"
                >
                  Products
                </button>
                <button 
                  onClick={() => scrollToSection('features')}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left py-2"
                  data-testid="nav-mobile-features"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left py-2"
                  data-testid="nav-mobile-testimonials"
                >
                  Testimonials
                </button>
                <button 
                  onClick={() => scrollToSection('faq')}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left py-2"
                  data-testid="nav-mobile-faq"
                >
                  FAQ
                </button>
                <div className="pt-3 flex flex-col gap-2">
                  <Button asChild variant="ghost" className="justify-start" data-testid="button-mobile-login">
                    <a href="/login">Sign In</a>
                  </Button>
                  <Button asChild className="bg-primary hover:bg-primary/90 text-white" data-testid="button-mobile-register">
                    <a href="/register">Get Started</a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 dark:opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
              <Badge variant="secondary" className="mb-4 px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Two Platforms, One Mission
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-heading font-bold text-foreground mb-6 leading-tight">
                Empowering Education with{" "}
                <span className="text-primary">StudentDrive</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Whether you're a school looking to streamline management, or an individual seeking to accelerate your learning - we've got you covered.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold" 
                  asChild 
                  data-testid="button-schools-cta"
                >
                  <a href="/school/register">
                    <Building2 className="mr-2 h-5 w-5" />
                    For Schools
                  </a>
                </Button>
                <Button 
                  size="lg"
                  variant="outline" 
                  className="border-2 font-semibold" 
                  data-testid="button-learners-cta"
                  asChild
                >
                  <a href="/register">
                    <UserCircle className="mr-2 h-5 w-5" />
                    For Learners
                  </a>
                </Button>
              </div>

              <div className="pt-8 border-t border-border/50 mt-8">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">500+ Schools</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">50,000+ Learners</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-[#fbbf24] fill-[#fbbf24] flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">4.9/5 Rating</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative h-[400px] lg:h-[500px] flex items-center justify-center">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroImage} 
                  alt="Students learning together" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Choose Your Platform
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              Two Solutions for Education
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pick the platform that matches your needs - manage a school or accelerate your learning journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* School Management System Card */}
            <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-primary/70"></div>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">School Management</h3>
                    <p className="text-muted-foreground">For Institutions</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  Complete school management solution for colleges, primary schools, and educational institutions. Manage students, staff, attendance, grades, fees, and more.
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Student & Staff Management</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Attendance & Grade Tracking</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Fee Collection & Invoicing</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Parent Portal Access</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Announcements & Messaging</span>
                  </li>
                </ul>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="flex-1" data-testid="button-register-school">
                    <a href="/school/register">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="flex-1" data-testid="button-login-school">
                    <a href="/school/login">School Login</a>
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-4 text-center">
                  14-day free trial, no credit card required
                </p>
              </CardContent>
            </Card>

            {/* Learning Platform Card */}
            <Card className="relative overflow-hidden border-2 hover:border-[#0ea5e9]/50 transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0ea5e9] to-[#0284c7]"></div>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 rounded-xl bg-[#0ea5e9]/10 flex items-center justify-center">
                    <GraduationCap className="h-8 w-8 text-[#0ea5e9]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Learning Platform</h3>
                    <p className="text-muted-foreground">For Self-Learners</p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  Self-paced learning platform for students and professionals. Access study materials, take quizzes, track progress, and achieve your learning goals.
                </p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-[#0ea5e9] flex-shrink-0" />
                    <span>50,000+ Study Materials</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-[#0ea5e9] flex-shrink-0" />
                    <span>Interactive Quizzes</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-[#0ea5e9] flex-shrink-0" />
                    <span>Progress Analytics</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-[#0ea5e9] flex-shrink-0" />
                    <span>Bookmarks & Notes</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-[#0ea5e9] flex-shrink-0" />
                    <span>Learn Anywhere, Anytime</span>
                  </li>
                </ul>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="flex-1 bg-[#0ea5e9] hover:bg-[#0284c7]" data-testid="button-register-learner">
                    <a href="/register">
                      Start Learning Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="flex-1" data-testid="button-login-learner">
                    <a href="/login">Learner Login</a>
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Free to start, upgrade anytime
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section - SMS */}
      <section id="features" className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Building2 className="h-3.5 w-3.5 mr-1.5" />
              School Management Features
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              Everything Schools Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to manage every aspect of your educational institution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {smsFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border hover:border-primary/30">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - LMS */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4 bg-[#0ea5e9]/10 text-[#0ea5e9] border-[#0ea5e9]/20">
              <GraduationCap className="h-3.5 w-3.5 mr-1.5" />
              Learning Platform Features
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              Accelerate Your Learning
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tools designed to help you learn faster, retain more, and achieve your goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lmsFeatures.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border hover:border-[#0ea5e9]/30">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center mb-4 group-hover:bg-[#0ea5e9]/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-[#0ea5e9]" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              Loved by Schools & Learners
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what our users say about StudentDrive
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-[#fbbf24] fill-[#fbbf24]" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                    <Badge variant="outline" className={testimonial.type === 'school' ? 'text-primary border-primary/30' : 'text-[#0ea5e9] border-[#0ea5e9]/30'}>
                      {testimonial.type === 'school' ? 'School' : 'Learner'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="overflow-hidden">
                <button
                  className="w-full p-6 text-left flex items-center justify-between gap-4"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  data-testid={`button-faq-${index}`}
                >
                  <span className="font-semibold text-foreground">{faq.question}</span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 text-muted-foreground">
                    {faq.answer}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
            Ready to Transform Education?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of schools and thousands of learners already using StudentDrive to achieve their educational goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild data-testid="button-cta-school">
              <a href="/school/register">
                <Building2 className="mr-2 h-5 w-5" />
                Register Your School
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" asChild data-testid="button-cta-learner">
              <a href="/register">
                <GraduationCap className="mr-2 h-5 w-5" />
                Start Learning Free
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src={logoImg} alt="StudentDrive" className="h-10 w-10" />
                <span className="text-xl font-bold">StudentDrive</span>
              </div>
              <p className="text-slate-400 text-sm">
                Empowering education through technology for schools and individual learners.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Schools</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="/school/register" className="hover:text-white transition-colors">Register School</a></li>
                <li><a href="/school/login" className="hover:text-white transition-colors">School Login</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Learners</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="/register" className="hover:text-white transition-colors">Sign Up Free</a></li>
                <li><a href="/login" className="hover:text-white transition-colors">Learner Login</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              2024 StudentDrive. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
