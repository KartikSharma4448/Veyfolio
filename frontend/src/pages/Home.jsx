import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { FileText, Sparkles, Download, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';
import SEOHead from '../components/SEOHead';
import { HOME_TITLE, HOME_DESCRIPTION, HOME_SCHEMA } from '../seoConfig';

const Home = () => {

  // Inject JSON-LD structured data into the document head
  useEffect(() => {
    const script = document.getElementById('veyfolio-schema') || document.createElement('script');
    script.id = 'veyfolio-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(HOME_SCHEMA);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'AI-Powered Optimization',
      description: 'Refine your resume wording with optional AI-powered suggestions'
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Professional Templates',
      description: 'Choose between two clean, ATS-friendly resume layouts'
    },
    {
      icon: <Download className="w-8 h-8" />,
      title: 'Instant PDF Export',
      description: 'Download your polished CV as a high-quality PDF in seconds'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'ATS Optimization',
      description: 'Compare your resume with a job description and review keyword matches'
    }
  ];

  const benefits = [
    'Add your experience, education, and skills',
    'Real-time CV preview as you type',
    'AI-powered content suggestions',
    'Two clean, professional templates',
    'ATS compatibility scoring',
    'One-click PDF download'
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      <SEOHead
        title={HOME_TITLE}
        description={HOME_DESCRIPTION}
        path="/"
      />
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0a0a0b]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/veyfolio-logo.png" alt="" width="32" height="32" className="w-8 h-8 object-contain shrink-0" />
              <span className="text-xl font-bold text-white">Veyfolio</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
              <a href="#preview" className="text-gray-300 hover:text-white transition-colors">Preview</a>
            </nav>
            <Button 
              asChild
              className="bg-[#0066ff] hover:bg-[#0052cc] text-white"
            >
              <Link to="/create">Create CV <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="pt-14 pb-12 px-4 sm:px-6 border-b border-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 mb-5 text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">Your next chapter starts here</span>
              </div>
              <h1 className="text-[44px] font-bold text-white mb-5 leading-tight break-words">
                Veyfolio Resume Builder
              </h1>
              <p className="text-lg leading-relaxed text-gray-400 mb-7 max-w-2xl mx-auto">
                Give your experience a clear, professional voice. Build your resume, refine the details, and find the right words for your next opportunity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  asChild
                  size="lg"
                  className="bg-[#0066ff] hover:bg-[#0052cc] text-white text-base px-6 h-12"
                >
                  <Link to="/create">Build My Resume <ArrowRight className="w-4 h-4 ml-2" /></Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  asChild
                  className="bg-transparent border-gray-700 text-white hover:bg-gray-800 hover:text-white text-base px-6 h-12"
                >
                  <Link to="/create"><Sparkles className="w-5 h-5 mr-2" />Explore Templates</Link>
                </Button>
              </div>
              <p className="mt-5 text-sm text-gray-500">No signup required <span className="mx-3 text-gray-700">/</span> Live preview <span className="mx-3 text-gray-700">/</span> Two templates</p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="scroll-mt-24 py-12 px-4 sm:px-6 bg-[#0f0f10]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">
                Make your experience stand out
              </h2>
              <p className="text-base text-gray-400">
                The essentials for a focused, well-presented resume
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-[#171719] border border-gray-800 rounded-lg p-6 hover:border-gray-600 transition-colors"
                >
                  <div className={`${['text-blue-400', 'text-emerald-300', 'text-amber-300', 'text-cyan-300'][index]} mb-4`}>{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="scroll-mt-24 py-14 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-4">
                Build Your CV in 3 Simple Steps
              </h2>
              <p className="text-base text-gray-400">
                From your first detail to your finished resume
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Input Your Data',
                  description: 'Enter your professional information from LinkedIn or start from scratch'
                },
                {
                  step: '02',
                  title: 'Customize & Optimize',
                  description: 'Use AI suggestions to enhance your content and choose your template'
                },
                {
                  step: '03',
                  title: 'Download & Apply',
                  description: 'Export your ATS-optimized CV as PDF and start applying'
                }
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="text-sm font-semibold text-emerald-300 border-t border-gray-800 pt-4 mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-base leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section id="preview" className="scroll-mt-24 py-14 px-4 sm:px-6 bg-[#0f0f10]">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">
                  Why Choose Veyfolio?
                </h2>
                <p className="text-base leading-relaxed text-gray-400 mb-6">
                  Your story, thoughtfully presented. Keep your details and your resume preview side by side as you build.
                </p>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-[#0066ff] flex-shrink-0 mt-1" />
                      <span className="text-base text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <figure className="min-w-0">
                <img src="/Screenshot%202026-06-01%20202145.png" alt="Resume editor with personal details and a live resume preview" width="1280" height="720" loading="lazy" className="w-full h-auto rounded-lg border border-gray-700" />
              </figure>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-14 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-5">
              Ready to Build Your Perfect CV?
            </h2>
            <p className="text-base text-gray-400 mb-6">
              Start with your experience. Make it yours with Veyfolio.
            </p>
            <Button 
              asChild
              size="lg"
              className="bg-[#0066ff] hover:bg-[#0052cc] text-white text-base px-6 h-12 max-w-full"
            >
              <Link to="/create"><Sparkles className="w-5 h-5 mr-2" />Create My Resume</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/veyfolio-logo.png" alt="" width="24" height="24" className="w-6 h-6 object-contain shrink-0" />
                <span className="text-xl font-bold text-white">Veyfolio</span>
              </div>
              <p className="text-gray-400">
                Create professional CVs with AI-powered optimization
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><Link to="/create" className="hover:text-white transition-colors">Templates</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#preview" className="hover:text-white transition-colors">Resume Preview</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resume</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/create" className="hover:text-white transition-colors">Create Your CV</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Veyfolio. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
