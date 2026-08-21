-- ========================================================
-- サークル合宿カタログ・見積もりアプリ DBスキーマ (hotels & requests)
-- Supabase SQL Editor で全選択・実行してください。
-- ========================================================

-- 既存のテーブルを一度ドロップ（クリーンアップ）
DROP TABLE IF EXISTS public.requests CASCADE;
DROP TABLE IF EXISTS public.hotels CASCADE;

-- 1. 宿情報テーブル (`hotels`)
CREATE TABLE public.hotels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    area TEXT NOT NULL,
    main_image_url TEXT NOT NULL,
    images TEXT[] NOT NULL,
    tags TEXT[] NOT NULL,
    capacity INTEGER NOT NULL,
    description TEXT NOT NULL,
    facility_info JSONB NOT NULL
);

-- RLS 設定（誰でも読み取り可能）
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on hotels" ON public.hotels
    FOR SELECT USING (true);


-- 2. 見積もり依頼テーブル (`requests`)
CREATE TABLE public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_line_id TEXT,
    hotel_id TEXT NOT NULL,
    circle_name TEXT NOT NULL,
    leader_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    date TEXT NOT NULL,
    people_count INTEGER NOT NULL,
    budget TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL
);

-- RLS 設定（誰でも見積もり依頼の追加・参照が可能）
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert to requests" ON public.requests
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on requests" ON public.requests
    FOR SELECT USING (true);


-- 3. 関東近郊のダミー宿データ (5件) 挿入
INSERT INTO public.hotels (id, name, area, main_image_url, images, tags, capacity, description, facility_info)
VALUES 
(
  'h1',
  '伊豆オーシャンビュー 体育館付きリゾート',
  '伊豆・下田',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'
  ],
  ARRAY['体育館あり', 'コンパ部屋あり', 'BBQ可能', '温泉あり', '24時間音出し可'],
  150,
  '伊豆白浜海岸まで徒歩3分！バスケットコート2面分の私有体育館を併設した人気の合宿リゾート。夜は防音コンパルームで盛り上がれます。',
  '{
    "gym": "私有体育館（バスケ2面 / バドミントン6面）",
    "compa": "防音完備コンパルーム（持込自由・24時間利用可）",
    "bbq": "海が見える絶景BBQテラス（最大150名収容）",
    "bath": "天然温泉大浴場・露天風呂完備",
    "bus": "伊豆急下田駅より無料送迎バス15分"
  }'::jsonb
),
(
  'h2',
  '軽井沢フォレスト BBQガーデンコテージ',
  '軽井沢',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'
  ],
  ARRAY['BBQ可能', 'コテージ貸切', '花火OK', '持ち込み自由', '自然豊か'],
  80,
  '軽井沢の美しい森の中に広がる貸切コテージ村。全天候型の特大屋根付きBBQデッキで、本格的なアメリカンBBQとキャンプファイヤーが楽しめます。',
  '{
    "gym": "近隣町営体育館の手配可能（車10分）",
    "compa": "メインコテージ大広間（アンプ・カラオケ無料）",
    "bbq": "全天候型大型屋根付きBBQ施設（生ビールサーバー完備）",
    "bath": "檜作り大型家族風呂・ジャグジー",
    "bus": "軽井沢駅より送迎バス20分"
  }'::jsonb
),
(
  'h3',
  '南房総 サウンドスタジオペンション',
  '千葉・館山',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'
  ],
  ARRAY['音楽スタジオ', '24時間音出し可', '全館貸切', '海ちか', '機材無料'],
  60,
  '軽音・バンド・吹奏楽サークルに特化した防音スタジオ完備ペンション！プロ仕様のドラム・アンプセット・PA機材を無料で自由に利用可能です。',
  '{
    "gym": "防音音楽スタジオ3室（24時間音出しOK）",
    "compa": "全館貸切コンパ会場（飲み物・フード持込自由）",
    "bbq": "庭園BBQスペース（炭・道具一式貸出無料）",
    "bath": "展望風呂",
    "bus": "高速バス「館山駅」より車15分"
  }'::jsonb
),
(
  'h4',
  '箱根温泉 プレミアムゼミ＆研修ヴィラ',
  '箱根',
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'
  ],
  ARRAY['プロジェクター', '天然温泉', '会議室完備', 'アクセス抜群', '静かな環境'],
  100,
  'ゼミ合宿やビジネスサークルの研修に最適な箱根の温泉宿。高速Wi-Fi・ホワイトボード・大型プロジェクター完備の会議室を無料でご利用いただけます。',
  '{
    "gym": "大会議室2室（プロジェクター・スクリ－ン無料）",
    "compa": "宴会場（和洋宴会コース対応・飲み放題プランあり）",
    "bbq": "中庭テラス（事前予約制）",
    "bath": "源泉掛け流し天然温泉大浴場",
    "bus": "箱根湯本駅より路線バス25分"
  }'::jsonb
),
(
  'h5',
  '菅平高原 オールスポーツロヂ',
  '菅平',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
  ARRAY[
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'
  ],
  ARRAY['グラウンドあり', '体育館あり', 'ボリューム飯', '貸切バス手配', '大容量コンパ'],
  200,
  'サッカー・ラグビー・陸上・テニスなどあらゆるスポーツ合宿に対応！天然芝・人工芝グラウンド手配と、体育会学生も大満足のメガ盛り合宿ごはんが自慢。',
  '{
    "gym": "私有体育館1面 / 天然芝グラウンド手配",
    "compa": "200名収容の大コンパホール（音響・アンプ完備）",
    "bbq": "特大バーベキュー場（お肉食べ放題対応）",
    "bath": "サウナ付き大浴場（24時間入浴可能）",
    "bus": "上田駅発着貸切送迎バス手配"
  }'::jsonb
);
