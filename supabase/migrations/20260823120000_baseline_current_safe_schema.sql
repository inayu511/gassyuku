begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

do $baseline$
declare
  actual text[];
  expected text[];
  object_count integer;
  expression text;
  relation_owner text;
  relation_rls boolean;
  relation_force_rls boolean;
  relation_kind "char";
begin
  if to_regclass('public.inquiries') is null
     and to_regclass('public.inquiries_id_seq') is null then
    create sequence public.inquiries_id_seq
      as bigint
      increment by 1
      minvalue 1
      maxvalue 9223372036854775807
      start with 1
      cache 1
      no cycle;

    create table public.inquiries (
      id bigint not null default nextval('public.inquiries_id_seq'::regclass),
      created_at timestamp with time zone default now(),
      user_name text,
      email text,
      phone text,
      liff_user_id text,
      details jsonb,
      constraint inquiries_pkey primary key (id)
    );

    alter sequence public.inquiries_id_seq
      owned by public.inquiries.id;

    alter table public.inquiries enable row level security;

    revoke all privileges on table public.inquiries
      from public, anon, authenticated, service_role;
    revoke all privileges on sequence public.inquiries_id_seq
      from public, anon, authenticated, service_role;

    grant select, insert, update, delete, truncate, references, trigger, maintain
      on table public.inquiries
      to authenticated, service_role;
    grant select, update, usage
      on sequence public.inquiries_id_seq
      to authenticated, service_role;
  elsif to_regclass('public.inquiries') is null
        or to_regclass('public.inquiries_id_seq') is null then
    raise exception
      'baseline requires public.inquiries and public.inquiries_id_seq to both exist or both be absent';
  end if;

  select
    c.relkind,
    pg_get_userbyid(c.relowner),
    c.relrowsecurity,
    c.relforcerowsecurity
  into
    relation_kind,
    relation_owner,
    relation_rls,
    relation_force_rls
  from pg_class c
  where c.oid = 'public.inquiries'::regclass;

  if relation_kind <> 'r'
     or relation_owner <> 'postgres'
     or relation_rls is not true
     or relation_force_rls is not false then
    raise exception
      'public.inquiries relation metadata differs from the audited baseline';
  end if;

  select coalesce(
    array_agg(
      format('%s|%s|%s|%s', a.attnum, a.attname,
             format_type(a.atttypid, a.atttypmod), a.attnotnull::text)
      order by a.attnum
    ),
    array[]::text[]
  )
  into actual
  from pg_attribute a
  where a.attrelid = 'public.inquiries'::regclass
    and a.attnum > 0
    and not a.attisdropped;

  expected := array[
    '1|id|bigint|true',
    '2|created_at|timestamp with time zone|false',
    '3|user_name|text|false',
    '4|email|text|false',
    '5|phone|text|false',
    '6|liff_user_id|text|false',
    '7|details|jsonb|false'
  ];

  if actual <> expected then
    raise exception
      'public.inquiries columns differ from the audited baseline: %', actual;
  end if;

  select pg_get_expr(d.adbin, d.adrelid)
  into expression
  from pg_attrdef d
  join pg_attribute a
    on a.attrelid = d.adrelid
   and a.attnum = d.adnum
  where d.adrelid = 'public.inquiries'::regclass
    and a.attname = 'id';

  if expression not in (
    'nextval(''inquiries_id_seq''::regclass)',
    'nextval(''public.inquiries_id_seq''::regclass)'
  ) then
    raise exception
      'public.inquiries.id default differs from the audited baseline: %', expression;
  end if;

  select pg_get_expr(d.adbin, d.adrelid)
  into expression
  from pg_attrdef d
  join pg_attribute a
    on a.attrelid = d.adrelid
   and a.attnum = d.adnum
  where d.adrelid = 'public.inquiries'::regclass
    and a.attname = 'created_at';

  if expression <> 'now()' then
    raise exception
      'public.inquiries.created_at default differs from the audited baseline: %', expression;
  end if;

  select count(*)
  into object_count
  from pg_attrdef d
  where d.adrelid = 'public.inquiries'::regclass;

  if object_count <> 2 then
    raise exception
      'public.inquiries has an unexpected number of column defaults: %', object_count;
  end if;

  select coalesce(
    array_agg(
      format('%s|%s|%s', c.conname, c.contype,
             pg_get_constraintdef(c.oid, true))
      order by c.conname
    ),
    array[]::text[]
  )
  into actual
  from pg_constraint c
  where c.conrelid = 'public.inquiries'::regclass;

  expected := array['inquiries_pkey|p|PRIMARY KEY (id)'];

  if actual <> expected then
    raise exception
      'public.inquiries constraints differ from the audited baseline: %', actual;
  end if;

  select array[
    format_type(s.seqtypid, null),
    s.seqstart::text,
    s.seqincrement::text,
    s.seqmin::text,
    s.seqmax::text,
    s.seqcache::text,
    s.seqcycle::text,
    pg_get_userbyid(c.relowner)
  ]
  into actual
  from pg_sequence s
  join pg_class c on c.oid = s.seqrelid
  where s.seqrelid = 'public.inquiries_id_seq'::regclass;

  expected := array[
    'bigint',
    '1',
    '1',
    '1',
    '9223372036854775807',
    '1',
    'false',
    'postgres'
  ];

  if actual <> expected
     or pg_get_serial_sequence('public.inquiries', 'id')
        <> 'public.inquiries_id_seq' then
    raise exception
      'public.inquiries_id_seq differs from the audited baseline: %', actual;
  end if;

  select count(*)
  into object_count
  from pg_policy p
  where p.polrelid = 'public.inquiries'::regclass;

  if object_count <> 0 then
    raise exception
      'public.inquiries must have zero RLS policies, found %', object_count;
  end if;

  select coalesce(
    array_agg(
      format(
        '%s|%s|%s',
        case when acl.grantee = 0
          then 'PUBLIC'
          else pg_get_userbyid(acl.grantee)
        end,
        acl.privilege_type,
        acl.is_grantable::text
      )
      order by
        case when acl.grantee = 0
          then 'PUBLIC'
          else pg_get_userbyid(acl.grantee)
        end,
        acl.privilege_type
    ),
    array[]::text[]
  )
  into actual
  from pg_class c
  cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
  where c.oid = 'public.inquiries'::regclass
    and (
      acl.grantee = 0
      or pg_get_userbyid(acl.grantee) in ('anon', 'authenticated', 'service_role')
    );

  expected := array[
    'authenticated|DELETE|false',
    'authenticated|INSERT|false',
    'authenticated|MAINTAIN|false',
    'authenticated|REFERENCES|false',
    'authenticated|SELECT|false',
    'authenticated|TRIGGER|false',
    'authenticated|TRUNCATE|false',
    'authenticated|UPDATE|false',
    'service_role|DELETE|false',
    'service_role|INSERT|false',
    'service_role|MAINTAIN|false',
    'service_role|REFERENCES|false',
    'service_role|SELECT|false',
    'service_role|TRIGGER|false',
    'service_role|TRUNCATE|false',
    'service_role|UPDATE|false'
  ];

  if actual <> expected then
    raise exception
      'public.inquiries actor ACL differs from the audited baseline: %', actual;
  end if;

  select coalesce(
    array_agg(
      format(
        '%s|%s|%s',
        case when acl.grantee = 0
          then 'PUBLIC'
          else pg_get_userbyid(acl.grantee)
        end,
        acl.privilege_type,
        acl.is_grantable::text
      )
      order by
        case when acl.grantee = 0
          then 'PUBLIC'
          else pg_get_userbyid(acl.grantee)
        end,
        acl.privilege_type
    ),
    array[]::text[]
  )
  into actual
  from pg_class c
  cross join lateral aclexplode(coalesce(c.relacl, acldefault('S', c.relowner))) acl
  where c.oid = 'public.inquiries_id_seq'::regclass
    and (
      acl.grantee = 0
      or pg_get_userbyid(acl.grantee) in ('anon', 'authenticated', 'service_role')
    );

  expected := array[
    'authenticated|SELECT|false',
    'authenticated|UPDATE|false',
    'authenticated|USAGE|false',
    'service_role|SELECT|false',
    'service_role|UPDATE|false',
    'service_role|USAGE|false'
  ];

  if actual <> expected then
    raise exception
      'public.inquiries_id_seq actor ACL differs from the audited baseline: %', actual;
  end if;
end
$baseline$;

commit;
