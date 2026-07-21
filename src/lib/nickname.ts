/**
 * 건강/음식 테마의 랜덤 닉네임 생성기
 * 형식: [형용사] + [명사] + [숫자]
 */

const ADJECTIVES = [
  '건강한', '싱싱한', '활기찬', '튼튼한', '맛있는', '향긋한', '달콤한',
  '신선한', '푸릇한', '상큼한', '따뜻한', '시원한', '부드러운', '바삭한',
  '쫄깃한', '깔끔한', '말끔한', '청정한', '소박한', '담백한',
];

const NOUNS = [
  '아보카도', '브로콜리', '토마토', '당근', '오이', '시금치', '연어',
  '두부', '버섯', '바나나', '사과', '딸기', '블루베리', '견과류',
  '귀리', '퀴노아', '아몬드', '호두', '치즈', '요거트',
  '고구마', '단호박', '케일', '비트', '셀러리',
];

export function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100; // 100~999
  return `${adj} ${noun} ${num}`;
}
