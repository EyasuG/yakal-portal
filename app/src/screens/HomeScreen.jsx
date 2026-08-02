const SUBJECTS = ['Algebra', 'Geometry', 'Pre-Calculus', 'Calculus', 'Physics', 'SAT / ACT', 'AP Courses', 'College Essays'];

const BENEFITS = [
  ['01', 'A plan made for your student', 'We start with goals, strengths, and gaps—then build a clear path forward.'],
  ['02', 'Expert, one-on-one guidance', 'Patient tutors make hard concepts feel approachable, whether online or in person.'],
  ['03', 'Progress you can actually see', 'Families stay informed with session notes, milestones, and next steps in one portal.'],
];

const PROGRAMS = [
  {
    number: '01',
    eyebrow: 'Tutoring & enrichment',
    title: 'Build skills. Grow confidence.',
    copy: 'Personalized support for K–12 students in math, science, English, and test prep—paced for the way your student learns best.',
    tags: ['1-on-1 tutoring', 'Online + in person', 'Homework support', 'Test prep'],
    accent: 'teal',
  },
  {
    number: '02',
    eyebrow: 'College admissions',
    title: 'Turn ambition into a plan.',
    copy: 'Thoughtful, one-on-one guidance for school lists, essays, applications, scholarships, and every important deadline.',
    tags: ['College strategy', 'Essay coaching', 'Application review', 'Financial-aid guidance'],
    accent: 'pink',
  },
];

function Arrow() {
  return <span aria-hidden="true" className="promo-arrow">↗</span>;
}

function BrandMark() {
  return (
    <div className="promo-brand-mark" aria-hidden="true">
      <span>Y</span>
      <i />
    </div>
  );
}

function HomeScreen({ visible, onOpenAuth, onScroll }) {
  return (
    <div id="screen-home" className={`screen promo-page ${visible ? 'on' : ''}`}>
      <header className="promo-nav">
        <div className="promo-nav-inner">
          <button className="promo-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Yakal home">
            <BrandMark />
            <span>Yakal <b>Education</b></span>
          </button>
          <nav aria-label="Main navigation">
            <button onClick={() => onScroll('programs')}>Programs</button>
            <button onClick={() => onScroll('approach')}>Why Yakal</button>
            <button onClick={() => onScroll('contact')}>Contact</button>
          </nav>
          <button className="promo-login" onClick={() => onOpenAuth('login')}>Portal login <Arrow /></button>
        </div>
      </header>

      <main>
        <section className="promo-hero">
          <div className="promo-orbit promo-orbit-one" />
          <div className="promo-orbit promo-orbit-two" />
          <div className="promo-hero-inner">
            <div className="promo-hero-copy">
              <div className="promo-kicker"><span>✦</span> Silver Spring, Maryland · Online & in person</div>
              <h1>More confidence.<br /><em>More possibilities.</em></h1>
              <p>Personalized tutoring and college admissions guidance that helps students find their footing—and their way forward.</p>
              <div className="promo-actions">
                <button className="promo-primary" onClick={() => onOpenAuth('signup', 'parent', 'tutoring')}>Book a free consultation <Arrow /></button>
                <button className="promo-text-link" onClick={() => onScroll('programs')}>Explore our programs <span aria-hidden="true">↓</span></button>
              </div>
              <div className="promo-proof" aria-label="Yakal service highlights">
                <span><b>1:1</b> personalized support</span>
                <span><b>K–12</b> through college prep</span>
                <span><b>2 ways</b> online or in person</span>
              </div>
            </div>

            <div className="promo-hero-art" aria-label="Student growth illustration">
              <div className="promo-sun">✦</div>
              <div className="promo-note promo-note-top"><small>THIS WEEK</small><strong>3 goals completed</strong><span>Great momentum! →</span></div>
              <div className="promo-book">
                <div className="promo-book-page promo-book-left"><span>y = mx + b</span><i /><i /><i /></div>
                <div className="promo-book-page promo-book-right"><span>YOUR NEXT<br />CHAPTER</span><b>starts here.</b></div>
              </div>
              <div className="promo-pencil" />
              <div className="promo-note promo-note-bottom"><span className="promo-check">✓</span><div><small>PERSONALIZED PLAN</small><strong>Ready to grow</strong></div></div>
            </div>
          </div>
        </section>

        <section id="programs" className="promo-section promo-programs">
          <div className="promo-section-heading">
            <div><span className="promo-eyebrow">What we do</span><h2>One student.<br />One clear path forward.</h2></div>
            <p>Academic growth and college planning belong to the same journey. Yakal brings both together with personal guidance at every step.</p>
          </div>
          <div className="promo-program-grid">
            {PROGRAMS.map((program) => (
              <article key={program.number} className={`promo-program-card ${program.accent}`}>
                <span className="promo-card-number">{program.number}</span>
                <div className="promo-card-icon" aria-hidden="true">{program.accent === 'teal' ? '∑' : '★'}</div>
                <span className="promo-eyebrow">{program.eyebrow}</span>
                <h3>{program.title}</h3>
                <p>{program.copy}</p>
                <div className="promo-tags">{program.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <button onClick={() => onOpenAuth('signup', 'parent', program.accent === 'teal' ? 'tutoring' : 'admissions')}>Learn more <Arrow /></button>
              </article>
            ))}
          </div>
        </section>

        <section className="promo-subject-strip" aria-label="Subjects offered">
          <span className="promo-strip-label">Subjects we offer</span>
          <div>{SUBJECTS.map((subject) => <span key={subject}>{subject}</span>)}</div>
        </section>

        <section id="approach" className="promo-section promo-approach">
          <div className="promo-approach-intro">
            <span className="promo-eyebrow">The Yakal difference</span>
            <h2>Support that feels personal.<br /><em>Because it is.</em></h2>
            <p>We combine structure, flexibility, and genuinely human mentorship so students can build skills that last beyond the next test.</p>
            <button className="promo-primary" onClick={() => onOpenAuth('signup')}>Find the right support <Arrow /></button>
          </div>
          <div className="promo-benefit-list">
            {BENEFITS.map(([number, title, copy]) => (
              <article key={number}>
                <span>{number}</span><div><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="promo-cta">
          <div className="promo-cta-star">✦</div>
          <span className="promo-eyebrow">Your next step</span>
          <h2>Let’s build a brighter<br />path forward.</h2>
          <p>Tell us where your student is today. We’ll help you decide what comes next.</p>
          <div className="promo-actions promo-actions-center">
            <button className="promo-cta-button" onClick={() => onOpenAuth('signup')}>Book a free consultation <Arrow /></button>
            <a href="tel:+12404688617">Call (240) 468-8617</a>
          </div>
        </section>
      </main>

      <footer className="promo-footer">
        <div className="promo-logo"><BrandMark /><span>Yakal <b>Education</b></span></div>
        <p>Inspiring hope. Shaping futures.</p>
        <div><a href="mailto:yakaledu@gmail.com">yakaledu@gmail.com</a><span>Silver Spring, MD</span></div>
      </footer>
    </div>
  );
}

export default HomeScreen;
