import React from 'react'
import { ArrowRight, PlayCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import corporateIcon from '../assets/images/corporate-icon.png'
import educationIcon from '../assets/images/education-icon.png'
import govtIcon from '../assets/images/govt-icon.png'
import healthcareIcon from '../assets/images/healthcare-icon.png'
import heroIllustration from '../assets/images/hero-illustration.png'
import sentimentIcon from '../assets/images/sentiment-icon.png'
import summaryIcon from '../assets/images/summary-icon.png'
import wordcloudIcon from '../assets/images/wordcloud-icon.png'

function Landing() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.hash === '#features') {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
    }
    if (location.hash === '#how-it-works') {
      document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location.hash])

  const handleScrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="bg-surface text-on-surface">
      <section className="relative overflow-hidden pb-24 pt-20">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2 lg:px-8">
          <div className="z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Next-Gen Intelligence
            </div>
            <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tighter md:text-6xl">
              Analyze Thousands of <span className="text-primary">Comments</span> Instantly
              with AI
            </h1>
            <p className="mb-10 max-w-xl text-lg leading-relaxed text-on-surface-variant">
              Upload your feedback data and get sentiment analysis, summaries, and visual
              insights in seconds.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-lg bg-primary px-8 py-4 text-lg font-bold text-on-primary shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                Get Started
              </button>
              <button
                type="button"
                onClick={handleScrollToHowItWorks}
                className="flex items-center gap-2 rounded-lg bg-surface-container-high px-8 py-4 text-lg font-bold text-on-surface transition-colors hover:bg-surface-container-highest"
              >
                <PlayCircle className="h-5 w-5" />
                See How It Works
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-2xl shadow-on-surface/5">
              <img
                src={heroIllustration}
                alt="AI analysis dashboard preview"
                className="aspect-video w-full rounded-lg object-cover"
              />
            </div>
            <div className="absolute -left-8 top-1/2 h-32 w-1 -translate-y-1/2 rounded-full bg-primary-container" />
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 text-center md:grid-cols-3 lg:px-8">
          <div className="p-4">
            <p className="mb-1 text-4xl font-extrabold text-primary">10,000+</p>
            <p className="text-sm font-bold uppercase tracking-widest text-outline">
              Comments Analyzed
            </p>
          </div>
          <div className="border-outline-variant/20 p-4 md:border-x">
            <p className="mb-1 text-4xl font-extrabold text-primary">5+</p>
            <p className="text-sm font-bold uppercase tracking-widest text-outline">
              Industries Supported
            </p>
          </div>
          <div className="p-4">
            <p className="mb-1 text-4xl font-extrabold text-primary">95%</p>
            <p className="text-sm font-bold uppercase tracking-widest text-outline">
              Accuracy Rate
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="mb-4 text-4xl font-extrabold tracking-tighter">
              Everything You Need to Analyze Feedback
            </h2>
            <p className="text-on-surface-variant">
              Powerful tools engineered for clarity and precision in sentiment tracking.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <article className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-10 shadow-sm">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-container">
                <img src={sentimentIcon} alt="Sentiment analysis icon" className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-xl font-bold">Sentiment Analysis</h3>
              <p className="mb-6 text-on-surface-variant">
                Detects nuanced positive, negative, and neutral signals with high precision.
              </p>
            </article>
            <article className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-10 shadow-sm">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-fixed">
                <img src={summaryIcon} alt="Smart summary icon" className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-xl font-bold">Smart Summaries</h3>
              <p className="mb-6 text-on-surface-variant">
                Condenses large response sets into concise and actionable insights.
              </p>
            </article>
            <article className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-10 shadow-sm">
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-high">
                <img src={wordcloudIcon} alt="Visual insights icon" className="h-7 w-7" />
              </div>
              <h3 className="mb-4 text-xl font-bold">Visual Insights</h3>
              <p className="mb-6 text-on-surface-variant">
                Builds charts and word cloud intelligence for fast decision support.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-surface-container-low py-20 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <h2 className="mb-14 text-center text-3xl font-extrabold tracking-tighter">
            Get Insights in 3 Simple Steps
          </h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {[
              ['01', 'Upload', 'Drop your CSV or Excel files into the platform.'],
              ['02', 'AI Analyzes', 'The engine extracts sentiment and summary patterns.'],
              ['03', 'Get Insights', 'Explore dashboard visuals and export reports.'],
            ].map(([step, title, desc]) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-surface bg-surface-container-lowest shadow-lg">
                  <span className="text-2xl font-black text-primary">{step}</span>
                </div>
                <h4 className="mb-2 text-lg font-bold">{title}</h4>
                <p className="text-sm text-on-surface-variant">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-xl">
              <h2 className="mb-4 text-4xl font-extrabold tracking-tighter">
                Built for Every Industry
              </h2>
              <p className="text-on-surface-variant">
                Specialized sentiment models trained on industry-specific language.
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 font-bold text-primary transition-transform hover:translate-x-1"
            >
              Explore all sectors <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              ['Government', govtIcon],
              ['Corporate', corporateIcon],
              ['Education', educationIcon],
              ['Healthcare', healthcareIcon],
            ].map(([label, image]) => (
              <article key={label} className="group relative aspect-square overflow-hidden rounded-xl">
                <img
                  src={image}
                  alt={`${label} sector`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 to-transparent" />
                <h5 className="absolute bottom-5 left-5 text-xl font-bold text-white">{label}</h5>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default Landing
