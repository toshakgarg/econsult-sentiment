import React from 'react'
import { AlertTriangle, Lightbulb, Radar, ShieldCheck } from 'lucide-react'
import aboutIllustration from '../assets/images/about-illustration.png'
import azureLogo from '../assets/images/azure-logo.png'
import huggingfaceLogo from '../assets/images/huggingface-logo.png'
import mongodbLogo from '../assets/images/mongodb-logo.png'
import teamDivyam from '../assets/images/team-divyam.png'
import teamToshak from '../assets/images/team-toshak.png'

function About() {
  return (
    <main className="bg-surface text-on-surface">
      <section className="mx-auto max-w-screen-2xl px-6 pb-16 pt-20 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
          <div className="md:col-span-8">
            <span className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Analytical Intelligence
            </span>
            <h1 className="mb-8 text-6xl font-extrabold leading-[1.1] tracking-tighter md:text-7xl">
              About <br />
              eCon-Sentiment
            </h1>
            <p className="max-w-2xl text-xl leading-relaxed text-on-surface-variant">
              Transforming stakeholder feedback into a structured narrative through advanced
              language intelligence.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl rounded-xl bg-surface-container-low px-6 py-20 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
          <div className="relative pl-8">
            <div className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-primary-container" />
            <h2 className="mb-6 text-3xl font-bold tracking-tight">Our Mission</h2>
            <p className="mb-6 text-lg leading-relaxed text-on-surface-variant">
              In an era of information overload, clarity is essential. We empower decision-makers
              by distilling stakeholder comments into a unified sentiment pulse.
            </p>
            <p className="text-lg leading-relaxed text-on-surface-variant">
              By leveraging high-trust AI and transparent analytics, we reduce manual effort and
              improve policy insight quality.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-primary/5 p-3">
            <img
              src={aboutIllustration}
              alt="Data mission illustration"
              className="h-[400px] w-full rounded-xl object-cover shadow-xl"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 text-center lg:px-8">
        <div className="mb-8 inline-flex items-center justify-center rounded-full bg-error-container p-4 text-on-error-container">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mb-6 text-4xl font-extrabold tracking-tight">The Challenge</h2>
        <p className="mx-auto max-w-3xl text-xl leading-relaxed text-on-surface-variant">
          Traditional sentiment analysis often misses context. Analysts spend most of their time
          aggregating data, leaving limited bandwidth for strategic interpretation.
        </p>
      </section>

      <section className="mx-auto max-w-screen-2xl px-6 py-20 lg:px-8">
        <h2 className="mb-14 text-center text-xl font-bold uppercase tracking-[0.2em] text-primary">
          Our Approach
        </h2>
        <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
          {[
            {
              icon: <Lightbulb className="h-5 w-5" />,
              title: 'Semantic Contextualization',
              text: 'We analyze intent and nuance instead of simple keyword counts.',
              index: '01',
              color: 'bg-surface-container-low',
            },
            {
              icon: <Radar className="h-5 w-5" />,
              title: 'Real-Time Synthesis',
              text: 'Our architecture processes feedback quickly so dashboards stay current.',
              index: '02',
              color: 'bg-surface-container',
            },
            {
              icon: <ShieldCheck className="h-5 w-5" />,
              title: 'Transparent Metrics',
              text: 'Every insight is traceable with source-driven scoring and summaries.',
              index: '03',
              color: 'bg-surface-container-high',
            },
          ].map((item) => (
            <article
              key={item.title}
              className={`space-y-4 p-10 transition-colors duration-300 hover:bg-surface-container-highest ${item.color}`}
            >
              <span className="block text-4xl font-bold text-primary/20">{item.index}</span>
              <div className="text-primary">{item.icon}</div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="leading-relaxed text-on-surface-variant">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-surface-container-low px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-3xl font-bold">The Technology Stack</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                label: 'NLP Backbone',
                title: 'Azure AI Language',
                text: 'Enterprise-grade NLP for sentiment and key phrase extraction.',
                logo: azureLogo,
              },
              {
                label: 'Transformer Model',
                title: 'HuggingFace BART',
                text: 'Sequence-to-sequence summarization tuned for consultation data.',
                logo: huggingfaceLogo,
              },
              {
                label: 'Data Persistence',
                title: 'MongoDB Atlas',
                text: 'Scalable cloud persistence for analysis batches and metadata.',
                logo: mongodbLogo,
              },
            ].map((tech) => (
              <article
                key={tech.title}
                className="rounded-lg border border-outline-variant/10 bg-white p-8 shadow-sm"
              >
                <img src={tech.logo} alt={`${tech.title} logo`} className="mb-6 h-10 w-auto" />
                <span className="mb-3 block text-[0.6875rem] font-bold uppercase tracking-widest text-primary">
                  {tech.label}
                </span>
                <h3 className="mb-3 text-lg font-bold">{tech.title}</h3>
                <p className="text-sm leading-relaxed text-on-surface-variant">{tech.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-6 py-20 lg:px-8">
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="text-5xl font-extrabold tracking-tighter">The Visionaries</h2>
            <p className="mt-4 max-w-md text-on-surface-variant">
              The team shaping eCon-Sentiment’s engineering and user experience.
            </p>
          </div>
          <div className="hidden h-px flex-1 bg-outline-variant/20 md:block" />
        </div>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <a 
            href="https://toshakgarg.vercel.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-8 rounded-xl bg-surface-container-low p-8 hover:shadow-lg transition"
          >
            <img
              src={teamToshak}
              alt="Toshak Garg"
              className="h-32 w-32 rounded-full object-cover shadow-lg"
            />
            <div>
              <h3 className="text-2xl font-bold">Toshak Garg</h3>
              <p className="mb-4 font-medium text-primary">Full Stack Developer</p>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Builds robust backend pipelines and seamless frontend experiences for analysis
                workflows.
              </p>
            </div>
          </a>
          <a 
            href="https://divyambhalotia.tech" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-8 rounded-xl bg-surface-container-low p-8 hover:shadow-lg transition"
          >
            <img
              src={teamDivyam}
              alt="Divyam"
              className="h-32 w-32 rounded-full object-cover shadow-lg"
            />
            <div>
              <h3 className="text-2xl font-bold">Divyam</h3>
              <p className="mb-4 font-medium text-primary">UI/UX Designer</p>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Crafts intuitive interaction patterns and visual systems for clear data storytelling.
              </p>
            </div>
          </a>
        </div>
      </section>
    </main>
  )
}

export default About
