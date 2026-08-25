create table if not exists messages (
    id bigint generated always as identity primary key,
    text varchar(200) not null,
    created_at timestamptz not null default now()
);
