'use client';

/**
 * LEDGER - LANDING PAGE
 * 
 * Dark, professional Robinhood-style design
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PlaidLink from '@/components/PlaidLink';

export default function Home() {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);

  const handleSuccess = () => {
    setConnecting(false);
    // Check if onboarding is needed
    fetch('/api/profile/setup')
      .then(res => res.json())
      .then(data => {
        if (data.profile?.onboardingComplete) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      })
      .catch(() => router.push('/onboarding'));
  };

  return (
    <main className="min-h-screen bg-ledger-black">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-block mb-6 px-4 py-2 bg-ledger-green/10 border border-ledger-green/30 rounded-full">
            <span className="text-ledger-green text-sm font-medium">Financial Clarity for Everyone!</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="bg-gradient-to-r from-ledger-green via-ledger-cyan to-ledger-purple bg-clip-text text-transparent">
              Ledger
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-ledger-text-secondary mb-12 max-w-2xl mx-auto animate-slide-up">
            Stop guessing. Start knowing. Get AI-powered insights that actually help you save money.
          </p>

          <div className="animate-slide-up">
            <PlaidLink onSuccess={handleSuccess} />
          </div>

          {connecting && (
            <div className="mt-4 p-3 bg-ledger-card rounded-lg border border-ledger-border">
              <p className="text-ledger-text-secondary">Establishing secure connection...</p>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {[
            {
              title: 'Income Tracking',
              description: 'Understand your cash flow with automatic income detection and pattern recognition.',
              icon: '$',
              color: 'ledger-green',
            },
            {
              title: 'Smart Insights',
              description: 'Get personalized recommendations based on your spending habits and financial goals.',
              icon: '◆',
              color: 'ledger-cyan',
            },
            {
              title: 'Subscription Manager',
              description: 'Never pay for forgotten subscriptions again. We track every recurring charge.',
              icon: '↻',
              color: 'ledger-purple',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-ledger-card p-6 rounded-xl border border-ledger-border card-hover animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`text-4xl mb-4 text-${feature.color}`}></div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-ledger-text-secondary text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Connect Your Bank',
                description: 'Securely link your accounts through Plaid. Your credentials never touch our servers.',
              },
              {
                step: '2',
                title: 'Set Your Goals',
                description: 'Tell us what you\'re saving for and we\'ll help you get there.',
              },
              {
                step: '3',
                title: 'Get Insights',
                description: 'Our AI analyzes your spending and gives you actionable recommendations.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-ledger-green flex items-center justify-center text-ledger-black font-bold text-xl">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-ledger-text-secondary">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-ledger-card rounded-full border border-ledger-border">
            <svg className="w-5 h-5 text-ledger-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-sm text-ledger-text-secondary">
              Bank-grade security • Encrypted • Read-only access
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-ledger-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-ledger-text-secondary">
          <p>Powered by Plaid • OpenAI • Next.js</p>
        </div>
      </div>
    </main>
  );
}
