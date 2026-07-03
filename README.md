# 🌿 한끼 밥상 탄소 계산기

> 내가 먹는 한 끼 식사가 지구에 얼마나 영향을 줄까?  
> 음식을 골라 식탁에 올리면, 탄소 발자국을 실시간으로 계산해 줍니다.

---

## 📸 미리보기

| 데스크톱 화면 | 모바일 화면 (375px) |
|:---:|:---:|
| 음식을 클릭하면 나무 식탁 위에 올라가고,<br>CO₂ 배출량·승용차 거리·소나무 그루 수가 실시간 계산됩니다. | 카테고리 탭이 가로 스크롤로 전환되고,<br>카드가 3열로 정렬되며 버튼이 세로 배치됩니다. |

---

## ✨ 주요 기능

### 🍚 탄소 발자국 계산
- **21종 한식 메뉴** (밥·죽·면, 국·탕·찌개, 반찬·고기, 기타·분식)를 카드 UI로 선택
- 음식 클릭 시 **나무 식탁 위에 이모지가 팝업 애니메이션**과 함께 등장
- **총 CO₂ 배출량** (kgCO₂e), **승용차 주행 거리 환산** (km), **소나무 흡수 그루 수** 실시간 표시
- 기간별 누적 환산 (1일 / 1주일 / 1개월 / 1년)

### 🔐 회원 인증 시스템 (Supabase Auth)
- **회원가입** — 이메일 + 비밀번호(영문·숫자 조합 8자 이상) + 힌트 질문/답변
- **로그인 필수 가드** — 비로그인 상태에서는 모달을 닫을 수 없음 (Shake 효과)
- **비밀번호 찾기** — 힌트 질문 기반 2단계 복구 (이메일 인증 메일 불필요)
- **비밀번호 변경** / **회원탈퇴** (이메일 마스킹 후 탈퇴 로그 보존)

### ☁️ 클라우드 데이터 저장
- 로그인 사용자의 식단을 **Supabase DB(JSONB)**에 저장
- 로그인·회원가입·탈퇴 이력 자동 기록 (감사 로그)
- **RLS(Row Level Security)** 적용 — 본인 데이터만 조회/수정/삭제 가능

### 📱 모바일 반응형 디자인
- **최소 375px**(iPhone SE 급)까지 레이아웃 최적화
- 카테고리 탭 → 가로 스크롤 전환
- 음식 카드 그리드 → 3열 축소 배치
- 식탁·아이콘·버튼 크기 자동 조절
- 모달 창 패딩·입력 요소 모바일 최적화

---

## 🛠 기술 스택

| 분류 | 기술 |
|---|---|
| **프론트엔드** | HTML5, Vanilla CSS, Vanilla JavaScript |
| **백엔드 / BaaS** | [Supabase](https://supabase.com) (Auth, Database, RPC Functions) |
| **폰트** | [Noto Sans KR](https://fonts.google.com/specimen/Noto+Sans+KR) (Google Fonts) |
| **데이터베이스** | PostgreSQL (Supabase 내장) |
| **보안** | RLS (Row Level Security), pgcrypto (bcrypt 해싱) |
| **AI 도구** | Gemini (코드 생성 및 반응형 레이아웃 개선) |

---

## 📁 프로젝트 구조

```
67-main/
├── index.html                  # 메인 HTML (UI 레이아웃 + 모달 4종)
├── style.css                   # 전체 스타일시트 (반응형 미디어쿼리 포함)
├── script.js                   # 핵심 로직 (계산기 + Supabase 인증/저장)
├── schema.sql                  # Supabase DB 스키마 (테이블 + RPC 함수)
├── carbon_calculator_guide.md  # 개발 가이드 & 로드맵
├── ANTIGRAVITY.md              # AI 코딩 에이전트 행동 규칙
├── .agents/AGENTS.md           # 프로젝트 레벨 에이전트 규칙
└── .gitignore
```

---

## 🚀 로컬 실행 방법

```bash
# 1. 저장소 클론
git clone https://github.com/hoho4872/67.git
cd 67

# 2. 로컬 서버 실행 (아래 중 하나 택)
npx http-server -p 8080
# 또는
python -m http.server 8080

# 3. 브라우저에서 접속
# http://localhost:8080
```

> ⚠️ Supabase 연동 기능(회원가입/로그인/저장)을 사용하려면  
> `script.js` 내의 `SUPABASE_URL`과 `SUPABASE_ANON_KEY`를 본인의 Supabase 프로젝트 키로 교체해야 합니다.

---

## 🗄 데이터베이스 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성합니다.
2. SQL Editor에서 `schema.sql` 파일의 내용을 실행합니다.
3. **Authentication > Providers > Email** 에서 `Confirm email` 옵션을 **Off**로 설정합니다 (개발 단계).
4. `script.js`의 `SUPABASE_URL`과 `SUPABASE_ANON_KEY`를 프로젝트 설정값으로 교체합니다.

### 생성되는 테이블 및 함수

| 테이블 / 함수 | 설명 |
|---|---|
| `user_meals` | 사용자 식단 기록 (음식 목록 JSONB + 총 탄소량) |
| `user_login_logs` | 로그인 이력 |
| `user_signup_logs` | 회원가입 이력 |
| `user_withdrawal_logs` | 탈퇴 이력 (이메일 마스킹 보존) |
| `user_password_hints` | 비밀번호 힌트 질문/답변 |
| `delete_user()` | 회원탈퇴 RPC 함수 (탈퇴 로그 적재 → 데이터 삭제 → 계정 삭제) |
| `get_user_hint_question()` | 이메일로 힌트 질문 조회 RPC 함수 |
| `verify_hint_and_reset_password()` | 힌트 답변 검증 후 비밀번호 재설정 RPC 함수 |

---

## 📋 개발 로드맵

- [x] **1단계** — Supabase 백엔드 구축 (DB 스키마 + RLS + RPC 함수)
- [x] **2단계** — HTML/CSS 프론트엔드 골격 (친환경 테마 UI)
- [x] **3단계** — 사용자 인증 연결 (가입/로그인/탈퇴/비번찾기)
- [x] **4단계** — 탄소 계산 비즈니스 로직 (실시간 합산 + 기간 환산)
- [x] **5단계** — 모바일 반응형 대응 (375px ~ 480px 미디어쿼리)

---

## 🤖 프롬프트 엔지니어링 전략

이 프로젝트는 **AI 코딩 에이전트**와 협업하여 개발되었습니다.

### 3단 프롬프트 구조

1. **블루프린트 (설계 문서)** — `carbon_calculator_guide.md`로 DB 스키마, Auth 설정, 5단계 로드맵, 테스트 체크리스트를 사전 정의
2. **에이전트 행동 규칙** — `AGENTS.md`로 "코딩 전 사고", "최소 코드 원칙", "수술적 변경" 등 품질 관리 규칙 설정
3. **단계별 구체적 프롬프트** — 기능 단위로 명확한 지시를 전달하여 기능을 하나씩 완성

> 안드레이 카파시의 **"프롬프트는 곧 프로그래밍이다"** 원칙에 기반하여,  
> LLM에게 좋은 프롬프트를 생성하는 **메타 프롬프트(프롬프트 블루프린터)** 방식을 활용했습니다.

---

## 📄 라이선스

이 프로젝트는 학습 및 포트폴리오 목적으로 제작되었습니다.