import pg from 'pg'
const { Client } = pg

export const connect = async (connectionString: string) => {
  const client = new Client(
    connectionString
  )
  await client.connect()
  return client
}
 
// const res = await client.query('SELECT $1::text as message', ['Hello world!'])
// console.log(res.rows[0].message) // Hello world!
// await client.end()