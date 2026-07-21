import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ARTICLES, ArticleCategory } from '../data/articles';

const CATEGORY_BG: Record<ArticleCategory, string> = {
  지질: 'bg-sage-50',
  당류: 'bg-coral/10',
  나트륨: 'bg-butter/15',
};

const CATEGORY_PILL: Record<ArticleCategory, string> = {
  지질: 'bg-sage-100 text-sage-600',
  당류: 'bg-coral/15 text-coral',
  나트륨: 'bg-butter/25 text-ink/70',
};

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const article = ARTICLES.find((a) => a.id === id);

  if (!article) return <Navigate to="/articles" replace />;

  return (
    <div className="pb-32 min-h-screen">
      {/* Top bar */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-black/[0.05] grid place-items-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-[11px] tracking-[0.18em] text-ink/30 font-semibold">{article.readTime} 읽기</span>
      </div>

      {/* Hero */}
      <div className={`mx-6 mt-2 rounded-3xl ${CATEGORY_BG[article.category]} h-44 grid place-items-center border border-black/[0.04]`}>
        <div className="text-5xl tracking-[0.4em]">{article.emojis.join(' ')}</div>
      </div>

      {/* Title */}
      <div className="px-6 mt-6">
        <span className={`pill ${CATEGORY_PILL[article.category]}`}>{article.category}</span>
        <h1 className="display text-[28px] leading-[1.2] mt-3 text-ink">
          {article.title}
        </h1>
        <p className="text-[14px] text-ink/50 mt-3 leading-relaxed">{article.excerpt}</p>
      </div>

      <div className="mx-6 mt-7 h-px bg-ink/[0.06]" />

      {/* Body */}
      <article className="px-6 mt-7 space-y-7">
        {article.sections.map((section, i) => (
          <section key={i}>
            {section.heading && (
              <h2 className="display text-xl text-ink mb-3">
                {section.heading}<span className="text-sage-400">.</span>
              </h2>
            )}
            <div className="space-y-3">
              {section.paragraphs.map((p, j) => (
                <p key={j} className="text-[14.5px] leading-[1.75] text-ink/75">
                  {p}
                </p>
              ))}
            </div>
            {section.callout && (
              <div
                className={`mt-4 rounded-2xl p-4 border flex gap-3 ${
                  section.callout.type === 'warning'
                    ? 'bg-coral/10 border-coral/20'
                    : 'bg-sage-50 border-sage-100'
                }`}
              >
                <span className="text-lg shrink-0">
                  {section.callout.type === 'warning' ? '⚠️' : '💡'}
                </span>
                <p
                  className={`text-[13px] leading-relaxed font-medium ${
                    section.callout.type === 'warning' ? 'text-coral' : 'text-sage-600'
                  }`}
                >
                  {section.callout.text}
                </p>
              </div>
            )}
          </section>
        ))}
      </article>

      {/* End mark */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="w-8 h-px bg-ink/20" />
        <span className="display text-xs italic text-ink/30 tracking-widest">— ClearPlate —</span>
      </div>
    </div>
  );
}
