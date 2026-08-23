# ADR 0001: Circle tenancy and authorization

- Status: Accepted
- Date: 2026-08-23
- Decision owners: Project owner and engineering
- Related: ADR 0002, Phase 0 Task 04

## Context

このサービスは複数大学・複数サークルが同じアプリケーションとデータベースを利用する。サークルの業務データは、利用者の大学ではなく `circle` をテナント境界として分離しなければならない。

認証主体は Supabase Auth の `auth.uid()` とする。URL、リクエストの `circleId`、クライアント state、画面の表示制御、LIFF profile／LIFF user ID、JWT の任意ユーザーメタデータは認可根拠にしない。LIFF を将来利用する場合も通知・導線などに限定し、Supabase Auth のセッションへ置き換えない。

ブラウザへ service role key を渡さない。tenant mutation は原則として利用者の Supabase Auth 文脈を維持する Server Action／Route Handler／限定 RPC から実行し、RLS を迂回しない。所有権移管、招待受諾、circle bootstrap など、複数行の不変条件を守る処理だけを、用途を限定したサーバー処理として実装する。

Production では匿名利用者が問い合わせ個人情報を SELECT／INSERT できる構成が存在した。これを再発させないため、認可は次の層で重ねる。

1. RLS と最小 GRANT
2. `circle_id` を含む外部キー・UNIQUE・CHECK・必要な constraint trigger
3. Server Action／限定 RPC の入力検証と transaction
4. クロステナント否定テスト
5. platform admin 操作の監査

## Decision

### Tenant boundary

#### Global data

- `auth.users`: Supabase Auth が管理する認証主体
- `profiles`: `auth.users` と 1:1 のアプリ内プロフィール。ブラウザへ公開する列と PII を混在させない
- `platform_admins`: platform 運用権限。ブラウザから直接参照しない
- `facilities`: 自社管理施設カタログの正本
- `facility_images`: 施設画像メタデータ
- `facility_features`: 自社管理の設備・特徴マスタ
- `facility_feature_assignments`: 施設と特徴の割当

#### Circle tenant data

- `circles`: tenant root
- `circle_members`
- `circle_invitations`
- `events`
- `event_attendance`
- `camp_trips`
- `camp_trip_participants`
- `camp_facility_candidates`

`circles.id` 自体が tenant key なので、`circles` は `circle_id` を重複保持しない。これは唯一の tenant-key 例外である。それ以外の tenant table は原則 `circle_id UUID NOT NULL` を持ち、作成後の変更を禁止する。

URL や入力 payload の `circle_id` は単なる候補値である。DB は必ず対象行の `circle_id` と `auth.uid()` の active membership を照合する。

### Cross-tenant referential integrity

RLS だけでは、同じユーザーが所属する Circle A の子行から Circle B の親行を参照する事故を防ぎ切れない。次の複合キーを使用する。

- `circle_members`: `UNIQUE (id, circle_id)`、`UNIQUE (circle_id, user_id)`
- `events`: `UNIQUE (id, circle_id)`
- `camp_trips`: `UNIQUE (id, circle_id)`
- `event_attendance (event_id, circle_id)` → `events (id, circle_id)`
- `event_attendance (circle_member_id, circle_id)` → `circle_members (id, circle_id)`
- `camp_trip_participants (camp_trip_id, circle_id)` → `camp_trips (id, circle_id)`
- `camp_trip_participants (circle_member_id, circle_id)` → `circle_members (id, circle_id)`
- `camp_facility_candidates (camp_trip_id, circle_id)` → `camp_trips (id, circle_id)`
- `camp_facility_candidates.facility_id` → global `facilities.id`

`events`、`camp_trips`、各子テーブルの `circle_id` は通常更新不可とし、DB trigger と UPDATE policy／column GRANT の両方で防御する。別circleへ移す必要が生じた場合は、行の付け替えではなく新規作成と明示的な移行手続きを新しい設計判断として扱う。

### ID policy

- domain entity の ID は UUID とする
- DB の `gen_random_uuid()` で生成する
- 連番 ID を公開認可・tenant 判定に使わない
- slug は表示・URL補助用であり、認可根拠にしない
- 外部施設 provider ID は保持しない
- 招待 token は暗号学的乱数を最低 32 byte 使用する
- 招待 token の平文は DB、ログ、LocalStorage に保存しない
- DB には token hash だけを保存し、比較はサーバー側で安全に行う
- token は期限付き・単回使用とし、受諾 transaction 内で使用済みにする

### Circle roles and membership states

Circle role は次の3種類に限定する。

- `owner`: 所有権、circle設定、officer昇降格、所有権移管
- `officer`: event、camp、member招待、出欠・参加者、候補施設の運用
- `member`: 所属circleの閲覧、自分の出欠・参加回答

Membership state は MVP で次を使用する。

- `active`
- `left`
- `removed`

招待中のユーザーを `circle_members` に先行作成しない。招待は `circle_invitations` で管理し、認証後の受諾成功時に初めて active membership を作成する。

Officer は member role の招待だけを発行できる。Owner は member／officer role の招待を発行できる。Owner role は招待で付与せず、既存 active member への所有権移管 transaction だけで付与する。

Platform admin はブラウザから全件閲覧できる特権roleにしない。`platform_admins` を JWT の任意 metadata の代わりにサーバー側で照合し、目的、操作者、対象、時刻、結果を監査できる管理経路に限定する。通常のtenant処理へ service roleを使用しない。

### Invariants

- circle には active owner が最低1人必要
- 最後の active owner は `left`／`removed` へ変更できない
- member／officer は自分を owner または officer へ昇格できない
- officer は owner を降格、削除、退会処理できない
- officer の任命・解除は active owner だけが開始できる
- 所有権移管は対象circleをlockした1 transactionで実行する
- 所有権移管は新ownerのactive membership確認、新owner昇格、旧ownerのrole変更、不変条件確認を原子的に行う
- tenant行の `circle_id` は通常変更不可
- 別circleの親レコードを参照できない
- attendance は対象eventおよび対象memberと同じcircleに属する
- participant は対象campおよび対象memberと同じcircleに属する
- candidate は対象campと同じcircleに属する
- candidateが参照する施設は追加時点で `published = true` でなければならない
- hard deleteは原則使用せず、`status`、`archived_at`、`left`、`removed`、`used_at`などへ置き換える

Owner最低1人の条件は通常の CHECK だけでは表現できない。所有権移管・退会・削除経路を限定transactionに集約し、行lockと deferrable constraint trigger 等を組み合わせ、commit時にも検証する。

## RLS helper policy

SQL実装時は、少なくとも次の責務を持つhelperを検討する。名称とsignatureはTask 06のmigrationレビューで確定する。

- `is_active_circle_member(p_circle_id uuid, p_user_id uuid)`: active membershipの存在判定
- `has_circle_role(p_circle_id uuid, p_user_id uuid, p_allowed_roles circle_role[])`: activeかつ許可roleか判定
- `is_circle_owner(p_circle_id uuid, p_user_id uuid)`: active ownerか判定

Policyは認証主体として常に `auth.uid()` を渡す。クライアントが渡す user ID を主体として信用しない。

Helper実装要件は次のとおり。

- `circle_members` 自身のpolicyから再帰しない実装にする
- `SECURITY DEFINER` が必要なら `search_path` を空または固定し、参照objectをschema修飾する
- ownerは専用のno-login DB role等に限定し、一般ユーザーが関数を変更できないようにする
- `PUBLIC` のEXECUTEをrevokeし、必要なroleだけへ付与する
- dynamic SQLを使用しない
- 引数だけを信用せず、行のtenant keyと `auth.uid()` を照合する
- helperの変更権限と実行権限を最小化する
- service role keyをブラウザ、Client Component、公開環境変数へ渡さない

## Actor × operation RLS matrix

この行列の「可」は、RLS、GRANT、列制約、Server Actionの検証をすべて満たす場合だけを意味する。tenant actorの条件は対象行のcircleについて評価する。

略記：

- `OWN`: 対象profileが `auth.uid()` 自身
- `MEMBER(c)`: `is_active_circle_member(row.circle_id, auth.uid())`
- `OFFICER(c)`: `has_circle_role(row.circle_id, auth.uid(), ['officer','owner'])`
- `OWNER(c)`: `is_circle_owner(row.circle_id, auth.uid())`
- `SELF`: 対象attendance／participantのmembershipが `auth.uid()` 自身
- `PUB`: 親facilityが `published = true`
- `SERVER`: 認証・権限再確認、入力検証、transaction、監査を備えた非ブラウザ経路
- 「拒否（serverのみ）」はブラウザの直接table操作を許可しないという意味

### `profiles`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 拒否 | 可: OWN | 可: OWN | 可: OWN | 可: OWN | 可: SERVER・業務上必要な対象だけ |
| INSERT | 拒否 | 拒否（signup連動serverのみ） | 拒否 | 拒否 | 拒否 | 可: SERVER・対応するauth userだけ |
| UPDATE | 拒否 | 可: OWN・許可列のみ | 可: OWN・許可列のみ | 可: OWN・許可列のみ | 可: OWN・許可列のみ | 可: SERVER・PII目的制限付き |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 拒否（無効化・保持方針で処理） |

Circle内の表示名一覧が必要な場合も、PIIを含む`profiles`全行を共同memberへ直接公開しない。公開可能列だけのserver projectionを別途設計する。

### `platform_admins`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 可: SERVER・監査対象 |
| INSERT | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 可: 二者承認等の管理手順のみ |
| UPDATE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 可: SERVER・付与／失効を監査 |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 拒否（失効状態を使用） |

### `circles`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 拒否 | 拒否 | 可: MEMBER(c) | 可: OFFICER(c) | 可: OWNER(c) | 可: SERVER・対象限定 |
| INSERT | 拒否 | 拒否（bootstrap RPCのみ） | 拒否 | 拒否 | 拒否 | 可: SERVER・監査付きサポートのみ |
| UPDATE | 拒否 | 拒否 | 拒否 | 拒否 | 可: OWNER(c)・通常設定列のみ | 可: SERVER・不変条件維持 |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否（archiveのみ） | 拒否（archiveのみ） |

### `circle_members`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 拒否 | 拒否 | 可: MEMBER(c)・必要列のみ | 可: OFFICER(c) | 可: OWNER(c) | 可: SERVER・対象限定 |
| INSERT | 拒否 | 拒否（招待受諾／bootstrapのみ） | 拒否 | 拒否 | 拒否 | 可: SERVER・不変条件維持 |
| UPDATE | 拒否 | 拒否 | 拒否（自己退会serverのみ） | 拒否（member運用serverのみ） | 拒否（role／所有権処理serverのみ） | 可: SERVER・actor role再確認 |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 拒否（left／removedを使用） |

### `circle_invitations`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 拒否 | 拒否 | 拒否 | 拒否（一覧非公開） | 拒否（一覧非公開） | 可: SERVER・token hash／対象を限定 |
| INSERT | 拒否 | 拒否 | 拒否 | 拒否（member招待serverのみ） | 拒否（member／officer招待serverのみ） | 可: SERVER・監査付きサポート |
| UPDATE | 拒否 | 拒否（受諾serverのみ） | 拒否 | 拒否 | 拒否 | 可: SERVER・使用済み／失効のみ |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 拒否（期限・使用状態で保持） |

### `events`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 拒否 | 拒否 | 可: MEMBER(c) | 可: OFFICER(c) | 可: OWNER(c) | 可: SERVER・対象限定 |
| INSERT | 拒否 | 拒否 | 拒否 | 可: OFFICER(c)・作成者をauth.uid()へ固定 | 可: OWNER(c)・作成者をauth.uid()へ固定 | 可: SERVER・監査付き |
| UPDATE | 拒否 | 拒否 | 拒否 | 可: OFFICER(c)・tenant key以外 | 可: OWNER(c)・tenant key以外 | 可: SERVER・不変条件維持 |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否（archiveのみ） | 拒否（archiveのみ） | 拒否（archiveのみ） |

### `event_attendance`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 拒否 | 拒否 | 可: MEMBER(c)かつSELF | 可: OFFICER(c)・同circle | 可: OWNER(c)・同circle | 可: SERVER・対象限定 |
| INSERT | 拒否 | 拒否 | 可: MEMBER(c)かつSELF | 可: OFFICER(c)・対象memberも同circle・actor記録 | 可: OWNER(c)・対象memberも同circle・actor記録 | 可: SERVER・監査付き |
| UPDATE | 拒否 | 拒否 | 可: MEMBER(c)かつSELF・回答列のみ | 可: OFFICER(c)・tenant／subject key以外 | 可: OWNER(c)・tenant／subject key以外 | 可: SERVER・不変条件維持 |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否（回答状態へ置換） | 拒否（回答状態へ置換） | 拒否（回答状態へ置換） |

### `camp_trips`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 拒否 | 拒否 | 可: MEMBER(c) | 可: OFFICER(c) | 可: OWNER(c) | 可: SERVER・対象限定 |
| INSERT | 拒否 | 拒否 | 拒否 | 可: OFFICER(c)・作成者をauth.uid()へ固定 | 可: OWNER(c)・作成者をauth.uid()へ固定 | 可: SERVER・監査付き |
| UPDATE | 拒否 | 拒否 | 拒否 | 可: OFFICER(c)・tenant key以外 | 可: OWNER(c)・tenant key以外 | 可: SERVER・不変条件維持 |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否（archiveのみ） | 拒否（archiveのみ） | 拒否（archiveのみ） |

### `camp_trip_participants`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 拒否 | 拒否 | 可: MEMBER(c)かつSELF | 可: OFFICER(c)・同circle | 可: OWNER(c)・同circle | 可: SERVER・対象限定 |
| INSERT | 拒否 | 拒否 | 可: MEMBER(c)かつSELF | 可: OFFICER(c)・対象memberも同circle・actor記録 | 可: OWNER(c)・対象memberも同circle・actor記録 | 可: SERVER・監査付き |
| UPDATE | 拒否 | 拒否 | 可: MEMBER(c)かつSELF・回答列のみ | 可: OFFICER(c)・tenant／subject key以外 | 可: OWNER(c)・tenant／subject key以外 | 可: SERVER・不変条件維持 |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否（参加状態へ置換） | 拒否（参加状態へ置換） | 拒否（参加状態へ置換） |

### `facilities`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 可: PUB | 可: PUB | 可: PUB | 可: PUB | 可: PUB | 可: SERVER・非公開を含む編集対象 |
| INSERT | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 可: SERVER・管理運用のみ |
| UPDATE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 可: SERVER・公開操作を監査 |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 拒否（非公開／archiveを使用） |

### `facility_images`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 可: 親がPUB | 可: 親がPUB | 可: 親がPUB | 可: 親がPUB | 可: 親がPUB | 可: SERVER・編集対象 |
| INSERT | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 可: SERVER・承認済み画像のみ |
| UPDATE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 可: SERVER・親facility固定 |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 拒否（非表示／置換を使用） |

### `facility_features`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 可: PUB施設から参照あり | 可: PUB施設から参照あり | 可: PUB施設から参照あり | 可: PUB施設から参照あり | 可: PUB施設から参照あり | 可: SERVER・全マスタ |
| INSERT | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 可: SERVER・管理運用のみ |
| UPDATE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 可: SERVER・key変更制限 |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 拒否（inactive化を使用） |

### `facility_feature_assignments`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 可: 親がPUB | 可: 親がPUB | 可: 親がPUB | 可: 親がPUB | 可: 親がPUB | 可: SERVER・編集対象 |
| INSERT | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 可: SERVER・管理運用のみ |
| UPDATE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 拒否（削除相当＋新規割当をserver transactionで実施） |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否 | 拒否 | 可: SERVER・管理運用、監査付き |

`facility_feature_assignments` の削除は施設マスタ編集上の関連解除であり、tenant業務データのhard delete禁止とは性質が異なる。管理されたserver transactionに限って許可する。

### `camp_facility_candidates`

| Operation | anon | authenticated non-member | active member | active officer | active owner | platform admin server operation |
|---|---|---|---|---|---|---|
| SELECT | 拒否 | 拒否 | 可: MEMBER(c) | 可: OFFICER(c) | 可: OWNER(c) | 可: SERVER・対象限定 |
| INSERT | 拒否 | 拒否 | 拒否 | 可: OFFICER(c)・camp同circle・facilityがPUB | 可: OWNER(c)・camp同circle・facilityがPUB | 可: SERVER・監査付き |
| UPDATE | 拒否 | 拒否 | 拒否 | 可: OFFICER(c)・tenant／camp／facility key以外 | 可: OWNER(c)・tenant／camp／facility key以外 | 可: SERVER・不変条件維持 |
| DELETE | 拒否 | 拒否 | 拒否 | 拒否（候補状態へ置換） | 拒否（候補状態へ置換） | 拒否（候補状態へ置換） |

## Circle bootstrap

Membershipがまだ存在しない認証済み利用者によるcircle作成は、クライアントから`circles`だけを直接INSERTする方式にしない。

次を1つのDB transactionで行うServer Actionまたは用途限定RPCを使用する。

1. サーバーが有効なSupabase Auth sessionと`auth.uid()`を確認する
2. 入力を検証する
3. circleを作成する
4. 作成者の`circle_members`を`role = owner`、`status = active`で作成する
5. owner最低1人の不変条件を確認する
6. どれか1つでも失敗した場合は全体をrollbackする

限定RPCを`SECURITY DEFINER`にする場合は、固定`search_path`、明示schema、最小EXECUTE権限、呼出回数制限、監査を必須にする。クライアントが任意user IDを作成者として指定できてはならない。

## Invitation flow

1. Active owner／officerがserver endpointへ招待発行を依頼する
2. サーバーがactorのactive membershipと招待可能roleを再確認する
3. 十分なentropyを持つtokenを生成し、hash、circle、招待role、期限、発行actorだけを保存する
4. 平文tokenを含む通常の共有URLを、その応答で一度だけ返す。DB・ログ・LocalStorageへ保存しない
5. 利用者が共有URLを開き、Supabase Authでログインする
6. サーバーがtoken hash、期限、未使用、未失効、対象roleを検証する
7. 対象circleをlockし、既存membershipとrole不変条件を確認する
8. membership作成と`used_at`更新を同じtransactionで行う
9. 再利用、期限切れ、競合した二重受諾を拒否する

LINE APIによる招待・通知はこのフローに含めない。

## Required negative tests

RLS／constraint／server処理を実装するTaskでは、最低限次を自動化する。成功レスポンスだけでなく、DBに行が作成・変更されていないことも確認する。

1. User AがCircle BをSELECTできない
2. URLの`circleId`をCircle Bへ変更しても取得できない
3. User AがCircle BのeventをUPDATEできない
4. User BがCircle AのattendanceをSELECTできない
5. memberが自分をofficer／ownerへ昇格できない
6. officerがownerを削除・降格できない
7. memberが他人のattendanceをUPDATEできない
8. 別circleのeventをattendanceから参照できない
9. 別circleのmemberをattendanceから参照できない
10. 別circleのcampをparticipantから参照できない
11. 別circleのcampへcandidateを追加できない
12. anonがすべてのtenant tableへSELECT／INSERT／UPDATE／DELETEできない
13. authenticated non-memberがtenant tableへアクセスできない
14. anonが`published = false`のfacility、image、feature、assignmentを取得できない
15. member／officer／ownerがfacility masterを変更できない
16. 招待tokenを再利用できない
17. 期限切れ・失効済みtokenを利用できない
18. officerがofficer／owner roleの招待を発行できない
19. circle作成が途中状態を残さない
20. 最後のownerが退会・削除できない
21. 所有権移管の途中失敗でownerが0人または複数の意図しない状態にならない
22. tenant行の`circle_id`をUPDATEできない
23. service role keyがclient bundleおよび公開環境変数に存在しない

## Migration implementation order

Task 06以降では、実Supabaseの読み取り専用catalog snapshotを取得してreviewした後、次の順に小さなmigrationとして実装する。

1. enum、domain、共通のupdated-at等の非認可関数
2. `profiles`、`platform_admins`
3. `circles`
4. `circle_members`とowner不変条件
5. RLS helper、最小GRANT、helper単体否定テスト
6. `circle_invitations`と招待transaction
7. `events`、`event_attendance`と複合FK
8. `camp_trips`、`camp_trip_participants`と複合FK
9. first-party `facilities`、画像、特徴
10. `camp_facility_candidates`と複合FK
11. 全actorのRLS否定テスト、transaction競合テスト、rollbackテスト

リポジトリの`supabase_schema.sql`は、確認済みの実DBと一致せず、過去の匿名公開policyも含むため、実DBbaselineとして扱わない。Task 06では実DBmetadataを読み取り専用で再確認し、適用済みmigrationと照合したうえでforward-only migrationを作る。

## Prohibited designs

- URLの`circleId`だけで認可済みとする
- Client Componentの表示制御だけで権限を守る
- service roleをブラウザへ渡す
- LIFF user ID／profileを認証主体にする
- JWTの任意user metadataをrole根拠にする
- tenant dataへ`USING (true)`を設定する
- tenant子tableから`circle_id`を省略する
- owner変更を複数の独立処理で行う
- 平文招待tokenを保存・記録する
- PIIをLocalStorageまたはログへ保存する
- 楽天APIまたは他の外部宿泊施設APIを設計へ戻す

## Consequences

### Positive

- circle境界をRLSと複合FKの両方で検証できる
- URL改変やクライアントバグが即座にクロステナント漏えいへつながらない
- role変更・所有権移管・招待の責務が明確になる
- 公開施設とtenant業務データを独立して運用できる
- 否定テストを認可仕様として利用できる

### Costs

- 複合FK、helper、transaction、監査経路の実装とテストが必要になる
- owner不変条件は単純なRLSだけでは保証できない
- profile表示用の安全なprojection設計が必要になる
- platform admin操作の監査保存先と保持期間を実装前に確定する必要がある

## Open questions before implementation

次は安全境界を変えない実装詳細として、Task 06のmigration承認前にユーザー判断を得る。

1. `profiles`の公開可能列とPII列の分離方法
2. Circle、event、camp、candidateのarchive状態名と保持期間
3. Platform admin操作の監査保存先、保持期間、緊急時の承認手順
4. 招待tokenの具体的な有効期間
