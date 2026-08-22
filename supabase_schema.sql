-- 1. 宿カタログテーブル (hotels) の作成
CREATE TABLE IF NOT EXISTS public.hotels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  main_image_url TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  capacity INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  facility_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 見積もり・空き確認依頼テーブル (requests) の作成
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_line_id TEXT NOT NULL,
  hotel_id TEXT NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  circle_name TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  date DATE NOT NULL,
  people_count INTEGER NOT NULL,
  budget TEXT NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. お問い合わせ・見積もりテーブル (inquiries) の作成
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_line_id TEXT,
  hotel_id TEXT,
  hotel_name TEXT,
  circle_name TEXT,
  leader_name TEXT,
  user_name TEXT,
  name TEXT,
  phone TEXT,
  date TEXT,
  people_count INTEGER,
  budget TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) の設定
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 全ユーザー（匿名ユーザー含む）に対する読み取り・書き込みポリシーの許可
CREATE POLICY "Allow public select to hotels" ON public.hotels FOR SELECT USING (true);

CREATE POLICY "Allow public insert to requests" ON public.requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to requests" ON public.requests FOR SELECT USING (true);

CREATE POLICY "Allow public insert to inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select to inquiries" ON public.inquiries FOR SELECT USING (true);
