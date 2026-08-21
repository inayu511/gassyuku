import { Hotel } from '@/types';

export const INITIAL_HOTELS: Hotel[] = [
  {
    id: 'h1',
    name: '伊豆オーシャンビュー 体育館付きリゾート',
    area: '伊豆・下田',
    main_image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['体育館あり', 'コンパ部屋あり', 'BBQ可能', '温泉あり', '24時間音出し可'],
    capacity: 150,
    description: '伊豆白浜海岸まで徒歩3分！バスケットコート2面分の私有体育館を併設した人気の合宿リゾート。夜は防音コンパルームで盛り上がれます。',
    facility_info: {
      gym: '私有体育館（バスケ2面 / バドミントン6面）',
      compa: '防音完備コンパルーム（持込自由・24時間利用可）',
      bbq: '海が見える絶景BBQテラス（最大150名収容）',
      bath: '天然温泉大浴場・露天風呂完備',
      bus: '伊豆急下田駅より無料送迎バス15分'
    }
  },
  {
    id: 'h2',
    name: '軽井沢フォレスト BBQガーデンコテージ',
    area: '軽井沢',
    main_image_url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80',
    images: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['BBQ可能', 'コテージ貸切', '花火OK', '持ち込み自由', '自然豊か'],
    capacity: 80,
    description: '軽井沢の美しい森の中に広がる貸切コテージ村。全天候型の特大屋根付きBBQデッキで、本格的なアメリカンBBQとキャンプファイヤーが楽しめます。',
    facility_info: {
      gym: '近隣町営体育館の手配可能（車10分）',
      compa: 'メインコテージ大広間（アンプ・カラオケ無料）',
      bbq: '全天候型大型屋根付きBBQ施設（生ビールサーバー完備）',
      bath: '檜作り大型家族風呂・ジャグジー',
      bus: '軽井沢駅より送迎バス20分'
    }
  },
  {
    id: 'h3',
    name: '南房総 サウンドスタジオペンション',
    area: '千葉・館山',
    main_image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80',
    images: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['音楽スタジオ', '24時間音出し可', '全館貸切', '海ちか', '機材無料'],
    capacity: 60,
    description: '軽音・バンド・吹奏楽サークルに特化した防音スタジオ完備ペンション！プロ仕様のドラム・アンプセット・PA機材を無料で自由に利用可能です。',
    facility_info: {
      gym: '防音音楽スタジオ3室（24時間音出しOK）',
      compa: '全館貸切コンパ会場（飲み物・フード持込自由）',
      bbq: '庭園BBQスペース（炭・道具一式貸出無料）',
      bath: '展望風呂',
      bus: '高速バス「館山駅」より車15分'
    }
  },
  {
    id: 'h4',
    name: '箱根温泉 プレミアムゼミ＆研修ヴィラ',
    area: '箱根',
    main_image_url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80',
    images: [
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['プロジェクター', '天然温泉', '会議室完備', 'アクセス抜群', '静かな環境'],
    capacity: 100,
    description: 'ゼミ合宿やビジネスサークルの研修に最適な箱根の温泉宿。高速Wi-Fi・ホワイトボード・大型プロジェクター完備の会議室を無料でご利用いただけます。',
    facility_info: {
      gym: '大会議室2室（プロジェクター・スクリーン無料）',
      compa: '宴会場（和洋宴会コース対応・飲み放題プランあり）',
      bbq: '中庭テラス（事前予約制）',
      bath: '源泉掛け流し天然温泉大浴場',
      bus: '箱根湯本駅より路線バス25分'
    }
  },
  {
    id: 'h5',
    name: '菅平高原 オールスポーツロヂ',
    area: '菅平',
    main_image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
    images: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80'
    ],
    tags: ['グラウンドあり', '体育館あり', 'ボリューム飯', '貸切バス手配', '大容量コンパ'],
    capacity: 200,
    description: 'サッカー・ラグビー・陸上・テニスなどあらゆるスポーツ合宿に対応！天然芝・人工芝グラウンド手配と、体育会学生も大満足のメガ盛り合宿ごはんが自慢。',
    facility_info: {
      gym: '私有体育館1面 / 天然芝グラウンド手配',
      compa: '200名収容の大コンパホール（音響・アンプ完備）',
      bbq: '特大バーベキュー場（お肉食べ放題対応）',
      bath: 'サウナ付き大浴場（24時間入浴可能）',
      bus: '上田駅発着貸切送迎バス手配'
    }
  }
];

export const POPULAR_TAGS = [
  '体育館あり',
  'コンパ部屋あり',
  'BBQ可能',
  '貸切バス手配',
  'グラウンドあり',
  '持ち込み自由',
  '音楽スタジオ',
  '天然温泉',
  '24時間音出し可'
];

export const AREAS = [
  'すべて',
  '伊豆・下田',
  '軽井沢',
  '千葉・館山',
  '箱根',
  '菅平'
];
