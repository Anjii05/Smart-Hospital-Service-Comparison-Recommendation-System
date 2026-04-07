import { Link } from 'react-router-dom';

const features = [
  { icon: '🔍', title: 'Search & Filter', desc: 'Find hospitals by location, treatment type, and budget.' },
  { icon: '⚖️', title: 'Side-by-Side Compare', desc: 'Compare hospitals on cost, doctors, facilities and ratings.' },
  { icon: '🤖', title: 'Smart Recommendations', desc: 'Get personalized suggestions based on your priorities.' },
  { icon: '⭐', title: 'Patient Reviews', desc: 'Read and submit reviews to help others decide.' },
];

const stats = [
  { value: '6+', label: 'Hospitals Listed' },
  { value: '12+', label: 'Specialist Doctors' },
  { value: '20+', label: 'Services Covered' },
  { value: '4.5★', label: 'Avg Rating' },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #064d40 0%, #0a6e5c 50%, #12a085 100%)',
        color: 'white',
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <h1 style={{ fontFamily: 'DM Serif Display', fontSize: 'clamp(2rem, 5vw, 3.2rem)', marginBottom: 16 }}>
          Find the Right Hospital <br />
          <em style={{ color: '#ffd166' }}>for You</em>
        </h1>
        <p style={{ fontSize: '1.15rem', opacity: 0.9, maxWidth: 540, margin: '0 auto 36px' }}>
          Compare hospitals by cost, doctors, and facilities. Get smart recommendations based on your needs.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/hospitals" className="btn btn-accent" style={{ fontSize: '1rem', padding: '12px 28px' }}>
            🔍 Browse Hospitals
          </Link>
          <Link to="/recommend" className="btn btn-outline" style={{ fontSize: '1rem', padding: '12px 28px', borderColor: 'white', color: 'white' }}>
            🤖 Get Recommendations
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: 'white', padding: '32px 24px', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {stats.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'DM Serif Display' }}>{s.value}</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 40 }}>Everything You Need to Decide</h2>
          <div className="grid-2">
            {features.map(f => (
              <div key={f.title} className="card" style={{ padding: '28px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '2.2rem' }}>{f.icon}</span>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--primary)', color: 'white', padding: '48px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'DM Serif Display', fontSize: '1.8rem', marginBottom: 12 }}>Ready to find the best care?</h2>
        <p style={{ opacity: 0.85, marginBottom: 24 }}>Compare hospitals now and make an informed choice.</p>
        <Link to="/compare" className="btn" style={{ background: 'white', color: 'var(--primary)', fontSize: '1rem', padding: '12px 28px' }}>
          ⚖️ Start Comparing
        </Link>
      </section>
    </div>
  );
}