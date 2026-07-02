import fs from 'node:fs/promises'
import pg from 'pg'

const sql = await fs.readFile(new URL('../migrations/20260623_init_splashwet.sql', import.meta.url), 'utf8')

const client = new pg.Client({
  host: 'db.kaxhqblnajfhuettvqnf.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Thelastpsi66@@',
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(sql)

const result = await client.query(`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
    and table_name in ('utilizadores', 'categorias', 'conteudos')
  order by table_name
`)

console.log(JSON.stringify(result.rows, null, 2))

await client.end()
