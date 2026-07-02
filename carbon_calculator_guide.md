# 한끼 밥상 탄소 계산기 - Supabase & 개발 가이드

이 문서는 **한끼 밥상 탄소 계산기**를 구축하기 위한 데이터베이스 스키마와 Supabase 설정 방법, 그리고 전체적인 개발 로드맵을 제공합니다.

---

## 1. Supabase 데이터베이스 설계 (SQL DDL)

Supabase의 SQL Editor에 아래 쿼리를 복사하여 실행하면 탄소 계산용 표준 데이터 테이블과 사용자 식사 기록 테이블(차후 저장 기능 확장용)이 생성되며, 기본적인 식재료 탄소 배출량 데이터가 입력됩니다.

```sql
-- 1. 식재료별 탄소 배출량 표준 데이터 테이블 생성
CREATE TABLE public.carbon_footprint_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ingredient_name VARCHAR(100) UNIQUE NOT NULL,
    carbon_footprint_per_100g NUMERIC NOT NULL, -- 100g당 이산화탄소 상당량 배출량 (kg CO2e)
    category VARCHAR(50) NOT NULL,              -- 육류, 채소류, 곡류, 유제품, 수산물 등
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. RLS (Row Level Security) 설정 - 모든 사용자가 읽을 수 있도록 허용
ALTER TABLE public.carbon_footprint_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.carbon_footprint_data
    FOR SELECT USING (true);

-- 3. 초기 식재료 데이터 삽입 (대표적인 식재료 100g당 탄소 배출량 기준 예시)
-- 출처 기준 간략화 예시 (단위: kg CO2e / 100g)
INSERT INTO public.carbon_footprint_data (ingredient_name, carbon_footprint_per_100g, category) VALUES
('소고기', 2.70, '육류'),
('돼지고기', 1.21, '육류'),
('닭고기', 0.69, '육류'),
('쌀 (백미)', 0.27, '곡류'),
('밀가루 (면류)', 0.14, '곡류'),
('두부/콩류', 0.08, '채소류'),
('토마토', 0.11, '채소류'),
('감자', 0.05, '채소류'),
('치즈/유제품', 1.35, '유제품'),
('우유', 0.19, '유제품'),
('생선 (연어/참치 등)', 0.54, '수산물'),
('달걀', 0.48, '기타')
ON CONFLICT (ingredient_name) DO UPDATE 
SET carbon_footprint_per_100g = EXCLUDED.carbon_footprint_per_100g,
    category = EXCLUDED.category;

-- 4. [차후 확장용] 사용자 식단 기록 테이블 생성
CREATE TABLE public.user_meals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    meal_date DATE DEFAULT CURRENT_DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL, -- 아침, 점심, 저녁, 간식
    items JSONB NOT NULL,           -- 선택된 식재료 정보 [ { "name": "소고기", "amount": 150 }, ... ]
    total_carbon NUMERIC NOT NULL,  -- 총 계산된 탄소 배출량 (kg CO2e)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. user_meals 테이블 RLS 설정 - 본인의 데이터만 조회/수정/삭제 가능
ALTER TABLE public.user_meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own meals" ON public.user_meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own meals" ON public.user_meals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals" ON public.user_meals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals" ON public.user_meals
    FOR DELETE USING (auth.uid() = user_id);
```

---

## 2. Supabase Auth 설정 가이드

웹 애플리케이션의 인증 기능이 제대로 동작하도록 Supabase 대시보드에서 다음 설정을 확인해야 합니다.

1. **Authentication > Providers > Email** 설정:
   * **Confirm email** 옵션: 이 옵션이 켜져 있으면 가입 후 인증 메일을 확인해야 로그인이 가능합니다. 개발 단계에서 메일 확인 없이 즉시 테스트하려면 이 옵션을 **비활성화(Off)** 하시는 것을 추천합니다.
2. **Authentication > URL Configuration**:
   * **Site URL**: 비밀번호 재설정 메일이나 이메일 확인 링크 클릭 시 돌아올 기본 URL입니다. 로컬 테스트 중인 경우 `http://localhost:5500` 또는 구글 스티치의 미리보기 URL 주소를 입력합니다.

---

## 3. 전체 개발 로드맵 (5단계)

### [1단계] 백엔드 구축
* Supabase에서 새 프로젝트를 생성하고, 위의 SQL DDL 쿼리를 실행하여 테이블을 구축합니다.
* API Keys (Project URL, Anon Key)를 확보합니다.

### [2단계] 프론트엔드 골격 잡기
* HTML5를 기반으로 하고, Tailwind CSS CDN을 로드하여 전체적인 UI 구조를 만듭니다.
* 친환경 테마에 맞는 색상(Green, Sage, Emerald, Beige)을 레이아웃에 배치합니다.

### [3단계] 사용자 인증(Auth) 연결
* Supabase JS Client CDN을 연동하여 로그인, 로그아웃, 회원가입, 비밀번호 변경, 탈퇴 흐름을 제어합니다.
* 유효성 검사 및 에러 얼럿창을 구현합니다.

### [4단계] 계산기 비즈니스 로직 작성
* DB(`carbon_footprint_data`)에서 식재료 목록을 실시간으로 가져옵니다.
* 사용자가 재료를 추가하고 무게(g)를 입력하면 실시간으로 계산 결과를 시각화(배출량에 따른 이모지 및 탄소 등급 라벨 A~E 표시)해 주는 로직을 구현합니다.

### [5단계] 로컬 테스트 및 최종 검증
* 아래 체크리스트를 활용하여 브라우저에서 최종 테스트를 수행합니다.

---

## 4. 인증 및 핵심 기능 테스트 체크리스트

- [ ] **회원가입**: 올바른 이메일과 비밀번호(6자 이상) 입력 시 가입 성공 및 자동 로그인 처리 완료 여부
- [ ] **로그인**: 가입된 계정으로 로그인 시 메인 화면(계산기 및 회원 전용 기능)으로 전환되는지 여부
- [ ] **아이디(이메일) 찾기**: 사용자가 가입했던 이메일 확인 방안 제공 (Supabase Auth는 이메일 자체가 ID 역할을 함)
- [ ] **비밀번호 재설정**: 이메일 주소를 입력하면 비밀번호 변경용 메일 링크가 전송되는지 여부
- [ ] **회원 탈퇴**: 탈퇴 처리 시 DB에서 유저 정보가 정상 삭제되고, 즉시 로그아웃 처리되어 로그인 화면으로 돌아가는지 여부
- [ ] **탄소 계산기**: 식재료와 수량을 선택하고 추가했을 때 총 탄소 발자국이 실시간 가산되어 계산되고 등급이 표시되는지 여부
