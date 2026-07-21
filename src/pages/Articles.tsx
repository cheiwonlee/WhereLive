import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { ARTICLES, ArticleCategory } from '../data/articles';

const FILTERS: ('전체' | ArticleCategory)[] = ['전체', '지질', '당류', '나트륨'];

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

export default function Articles() {
  const [filter, setFilter] = useState<'전체' | ArticleCategory>('전체');
  const filtered = filter === '전체' ? ARTICLES : ARTICLES.filter((a) => a.category === filter);

  return (
    <div className="pb-32">
      <Header date={new Date()} subtitle="READ" />

      <div className="px-6">
        <h2 className="display text-2xl">지질 탐구 생활<span className="text-sage-400">.</span></h2>
        <p className="text-[12px] text-ink/40 mt-1">일반인도 알기 쉬운 위해가능영양소 정보</p>
      </div>

      {/* Filter chips */}
      <div className="px-6 mt-5 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition ${
              filter === f ? 'bg-ink text-cream' : 'bg-white border border-black/[0.06] text-ink/60'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Article cards */}
      <div className="px-6 mt-5 space-y-4">
        {filtered.map((a) => (
          <Link
            to={`/articles/${a.id}`}
            key={a.id}
            className="block bg-white rounded-3xl overflow-hidden border border-black/[0.04] active:scale-[0.99] transition"
          >
            <div className={`${CATEGORY_BG[a.category]} h-28 grid place-items-center`}>
              <div className="text-4xl tracking-widest">{a.emojis.join(' ')}</div>
            </div>
            <div className="p-5">
              <span className={`pill ${CATEGORY_PILL[a.category]}`}>{a.category}</span>
              <h3 className="display text-xl mt-2 leading-snug">{a.title}</h3>
              <p className="text-[12px] text-ink/50 mt-1.5 leading-relaxed">{a.excerpt}</p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] text-ink/30">{a.readTime} 읽기</span>
                <span className="text-[11px] text-sage-600 font-semibold">읽어보기 →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
