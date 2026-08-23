# ADR 0002: First-party facility catalog

- Status: Accepted
- Date: 2026-08-23
- Decision owners: Project owner and engineering
- Related: ADR 0001, Phase 0 Task 04

## Context

既存のlocal系統には楽天トラベル関連コードが存在するが、remote mainを基点とする今後の設計へ移植しない。本サービスの施設カタログは、外部宿泊施設APIの検索結果を中継・同期するサービスではなく、プロジェクト側が内容と公開範囲に責任を持つfirst-partyカタログとする。

施設カタログは全利用者共通のglobal dataである。一方、公開施設を特定circleの合宿候補へ加えた時点で、その関連は`camp_facility_candidates`としてcircle tenant dataになる。この境界を混同しない。

## Decision

- 楽天APIを利用しない
- 楽天トラベルAPIを利用しない
- 楽天以外を含む外部宿泊施設APIを利用しない
- 施設検索は内部DBの公開済みfirst-party dataだけを対象にする
- 施設データの正本は内部`facilities` tableとする
- 一般公開は`published = true`の施設およびその公開関連情報だけとする
- 施設の作成、更新、画像管理、特徴管理、公開・非公開化は、platform側の管理されたserver経路だけで行う
- anon、一般authenticated user、circle member／officer／ownerは施設masterを作成・更新・削除できない
- `camp_facility_candidates`だけがcircle配下のtenant dataである
- 価格、空室、在庫のリアルタイム性を保証しない
- 外部サービスとの同期job、adapter、raw response保存を設けない

この方針を変更するには、新しい明示的なユーザー判断と、このADRを置き換える新しいADRが必要である。外部API連携を将来対応、後回し、候補、予定として扱わない。

## MVP data model

MVPの施設領域は次の5 tableに限定する。

### `facilities`

自社管理施設の正本。IDは`UUID DEFAULT gen_random_uuid()`とする。少なくとも次の責務を持つ。

- 安定した内部ID
- URL補助用の一意slug。認可根拠にはしない
- 名称、地域、説明、収容人数など、公開審査済みのカタログ情報
- `published BOOLEAN NOT NULL DEFAULT false`
- 公開日時、作成日時、更新日時
- archive／掲載停止状態

BrowserからSELECT可能なrowに内部メモ、契約情報、担当者PIIなどを混在させない。MVPでその情報が必要になっても、公開`facilities`列へ追加せず、別の明示的なsecurity reviewを行う。

### `facility_images`

- `id UUID`
- `facility_id UUID NOT NULL` → `facilities.id`
- 公開承認済み画像のstorage path／URL
- alt text、表示順、表示状態

一般利用者は親facilityが`published = true`の場合だけSELECTできる。未公開画像のobjectをpublic bucketへ置いてURL秘匿だけに依存しない。公開bucketを使う場合は公開承認済みassetだけを格納する。

### `facility_features`

- `id UUID`
- 内部key、表示label、表示順、active状態

一般利用者は公開施設から参照されているfeatureだけをSELECTできる。作成・名称変更・inactive化は管理server経路に限定する。

### `facility_feature_assignments`

- `facility_id UUID` → `facilities.id`
- `feature_id UUID` → `facility_features.id`
- `(facility_id, feature_id)`を複合主キーまたはUNIQUEにする

一般利用者は親facilityが公開済みの場合だけSELECTできる。割当変更は管理server transactionだけで行う。

### `camp_facility_candidates`

公開カタログとcircle tenantを接続する唯一のMVP関連tableである。

- `id UUID`
- `circle_id UUID NOT NULL`
- `camp_trip_id UUID NOT NULL`
- `facility_id UUID NOT NULL`
- 候補状態、表示順、circle内メモ、追加者、作成・更新日時
- `UNIQUE (camp_trip_id, facility_id)`
- `(camp_trip_id, circle_id)` → `camp_trips (id, circle_id)`の複合FK
- `facility_id` → `facilities.id`

追加時は、actorが対象circleのactive officer／ownerであること、campが同じcircleであること、facilityが`published = true`であることをRLSとserver validationで確認する。追加後に施設が非公開化された場合、candidate行は保持するが、一般利用者へ非公開施設の詳細を迂回表示しない。UIは「現在掲載されていない施設」として扱い、再選定を促す。

## Publication and access model

| Actor | Public facility SELECT | Unpublished facility SELECT | Facility master mutation | Candidate operation |
|---|---|---|---|---|
| anon | `published = true`のみ | 不可 | 不可 | 不可 |
| authenticated non-member | `published = true`のみ | 不可 | 不可 | 不可 |
| active member | `published = true`のみ | 不可 | 不可 | 所属circle候補のSELECTのみ |
| active officer | `published = true`のみ | 不可 | 不可 | 所属circleで追加・更新可能 |
| active owner | `published = true`のみ | 不可 | 不可 | 所属circleで追加・更新可能 |
| platform admin server operation | 必要範囲 | 管理対象のみ | 監査付きserver経路で可能 | サポート目的に限定 |

Public RLSは`facilities.published = true`を必須とし、image、feature、assignmentも公開facilityとの関連をEXISTS等で確認する。単なる`USING (true)`は採用しない。

施設の公開操作では最低限、必須表示項目、画像の公開承認、権利・掲載可否をserver側で検証する。公開・非公開化のactorと時刻を監査できるようにする。

## Explicitly excluded designs

次は現在の設計にも将来案にも含めない。

- 楽天トラベルAPI連携
- 楽天施設検索
- 楽天API用Route Handler
- 楽天API用adapter
- `RAKUTEN_APP_ID`
- `NEXT_PUBLIC_RAKUTEN_APP_ID`
- 楽天施設IDと内部施設IDの変換
- `facility_provider_records`
- `provider`
- `external_id`
- `raw_data`
- provider raw response保存
- 外部API同期履歴
- 外部providerからの定期同期・更新job
- 外部APIの価格、空室、在庫を前提とする検索・予約設計

既存local系統の楽天関連コード、型、環境変数、Route Handler、adapterはTask 04のclean worktreeへ移植しない。

## Consequences

### Benefits

- 外部API障害、仕様変更、廃止、rate limit、利用規約への依存を避けられる
- Facility型とデータ所有権を単純化できる
- 公開範囲と品質をプロジェクト側で管理できる
- 公開global dataとcircle tenant dataのRLS境界が明確になる
- provider ID変換やraw responseのPII／ライセンス管理が不要になる

### Constraints

- 施設情報の登録、確認、更新、掲載停止を行う運用が必要
- 価格・空室・在庫のリアルタイム検索は提供しない
- カタログ掲載数は管理・検証できる範囲から開始する
- 情報更新日と、最新情報は施設へ確認すべき旨を利用者へ明示する必要がある

## Required verification

実装時は少なくとも次を否定テストする。

1. anonは`published = false`のfacilityをSELECTできない
2. 公開facilityを経由せず、未公開image／feature／assignmentをSELECTできない
3. 一般authenticated userと全circle roleはfacility masterをINSERT／UPDATE／DELETEできない
4. memberはcandidateを追加・変更できない
5. officer／ownerは別circleのcampへcandidateを追加できない
6. 非公開facilityを新しいcandidateへ追加できない
7. candidate経由で非公開facilityの詳細を取得できない
8. client bundleと環境変数一覧に楽天／外部provider用keyが追加されていない
9. repositoryに外部provider table、adapter、同期jobが採用実装として追加されていない

## Open questions before implementation

次はfirst-party方針を変更しない運用詳細として、施設tableのmigration前に確定する。

1. MVPで公開する施設項目と必須項目
2. 施設情報の登録者、レビュー者、公開承認者
3. 画像storageの公開方式と権利確認記録
4. 情報更新日の表示方法と定期的な棚卸し頻度
