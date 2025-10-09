import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { KnightLogo } from "@/components/knight-logo";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { 
  Search, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap, 
  Globe, 
  CheckCircle,
  ArrowRight,
  Star,
  Briefcase
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-3 items-center font-semibold">
            <Link href={"/"} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <KnightLogo size="md" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Knight Devs
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <KnightLogo size="lg" className="animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Find Your Next
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Dream Job</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with top companies and discover opportunities across multiple job platforms. 
              Our intelligent scraping technology brings you the best jobs from LinkedIn, Indeed, Glassdoor, and more.
            </p>
            
            {/* Primary CTA */}
            <div className="flex justify-center mb-12">
              <Link 
                href="/auth/sign-up" 
                className="group bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Find Your Dream Job
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>10,000+ Active Jobs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>500+ Companies</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Updated Daily</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Knight Devs?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We&apos;ve built the most comprehensive job discovery platform with cutting-edge technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 p-8 rounded-2xl border border-blue-100 dark:border-slate-600 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Multi-Platform Scraping</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access jobs from LinkedIn, Indeed, Glassdoor, AngelList, and more all in one place. 
                No more checking multiple sites.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 p-8 rounded-2xl border border-purple-100 dark:border-slate-600 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Real-Time Updates</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get instant notifications when new jobs matching your criteria are posted. 
                Never miss an opportunity.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 p-8 rounded-2xl border border-green-100 dark:border-slate-600 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Verified Listings</h3>
              <p className="text-gray-600 dark:text-gray-300">
                All job postings are verified and filtered to ensure quality. 
                No spam or fake listings.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-slate-800 dark:to-slate-700 p-8 rounded-2xl border border-orange-100 dark:border-slate-600 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Matching</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our AI-powered algorithm matches you with the most relevant opportunities 
                based on your skills and preferences.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 p-8 rounded-2xl border border-indigo-100 dark:border-slate-600 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Community Driven</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Join a community of developers, designers, and tech professionals 
                sharing insights and opportunities.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 p-8 rounded-2xl border border-teal-100 dark:border-slate-600 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Career Growth</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track your application progress, get career insights, and discover 
                growth opportunities in your field.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl opacity-90">
              Join the growing community of successful job seekers and employers
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-lg opacity-90">Active Jobs</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-lg opacity-90">Companies</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-4xl font-bold mb-2">25K+</div>
              <div className="text-lg opacity-90">Job Seekers</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-lg opacity-90">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Find Your Next Opportunity?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of professionals who have already found their dream jobs through our platform
          </p>
          
          <div className="flex justify-center">
            <Link 
              href="/auth/sign-up" 
              className="group bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Star className="w-5 h-5" />
              Start Your Journey
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <KnightLogo size="md" />
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Knight Devs
                </h3>
              </div>
              <p className="text-gray-400 mb-4">
                The most comprehensive job discovery platform for tech professionals.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Get Started</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/candidate/discover" className="hover:text-white transition-colors">Browse Jobs</Link></li>
                <li><Link href="/auth/sign-up" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Knight Devs Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <ThemeSwitcher />
              <p className="text-gray-400 text-sm">
                Powered by{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  className="font-bold hover:text-white transition-colors"
                  rel="noreferrer"
                >
                  Supabase
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
