import pg from 'pg'
const { Client } = pg

export const connect = async (connectionString: string) => {
  const client = new Client(
    connectionString
  )
  await client.connect()
  return client
}
