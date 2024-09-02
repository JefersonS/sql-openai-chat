import OpenAI from "openai";
import { type NextRequest } from 'next/server'
import { connect } from "@/app/utils/dbHelper";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

// Global variable saving connection string and DB Model for in between calls
// This should be stored in the user session or database in a real application
// Value is lost when the server is restarted
let connectionString: string;
let dbModel: unknown[];

export async function POST(request: NextRequest) { 
  try {
    const requestBody = await request.json();

    const userMessage: ChatCompletionMessageParam = { role: 'user', content: requestBody.message};
    const history = requestBody.history || [];
    
    const completeChat = addMessageToHistory(userMessage, history);
    const completion = await askGPT(userMessage, completeChat);

    const responseMessage = completion.choices[0].message.content;

    if (responseMessage?.includes("CONNECTION_STRING_READY")) {
      connectionString = responseMessage.split("CONNECTION_STRING_READY: ")[1];
      const client = await connect(connectionString);
      // finds everything present in the public schema
      const model = await client.query(`
        SELECT table_schema, table_name, column_name 
          FROM information_schema.columns 
        WHERE table_schema in ('public')
      `);
      dbModel = model.rows;
      await client.end();
      return new Response(JSON.stringify({ message: 'Successfully connected to the database with the connection string! Now you can ask questions about your DB.'}));
    }

    console.log({completeChat})
    console.log({responseMessage})
    if (responseMessage?.includes("SQL_QUERY")) {
      const client = await connect(connectionString);
      const query = responseMessage.split("SQL_QUERY: ")[1];

      const response = await client.query(query);
      await client.end();

      console.log('################################### 2')
      console.log({data: JSON.stringify(response.rows)})
      if (query.toLowerCase().includes("select")) {
        const formatMessage: ChatCompletionMessageParam = {
          role: 'user',
          content: `Reply with the following DB response in a nicely styled html table format, never using maring:auto, dont add anything else other than the table: ${JSON.stringify(response.rows)}`
        }
        const formattedResponse = await askGPT(formatMessage, []);
        const formattedResponseMessage = formattedResponse.choices[0].message.content;
        return new Response(JSON.stringify({message: formattedResponseMessage}));
      }

      return new Response(JSON.stringify({ message: `Query executed successfully!`}));
    }

    return new Response(JSON.stringify({ message: responseMessage}));
  } catch (error) {
    console.error("Error fetching response from OpenAI:", error);
    return new Response(JSON.stringify({ message: "Sorry, something went wrong: " + error}));
  } 
}

const addMessageToHistory = (message: ChatCompletionMessageParam, history: ChatCompletionMessageParam[]): ChatCompletionMessageParam[] => {
  const systemMessage: ChatCompletionMessageParam = {
    "role": "system",
    "content": `
    You are a helpful assistant that is here only to provide SQL queries for a DB model that will be given to you.
    As a first message always ask for the DB connection string and validate that the format is correct, don't validate anything else other than the format.
    Once you have a valid connection string, you will reply with the following message: 'CONNECTION_STRING_READY: ' followed by the connection string.
    If the connection string is invalid, keep asking for a valid one pointing where the error is.
    After receiving the connection string you will receive questions about the DB model that will be provided later, you should either use the model information to form a response or when required create a valid SQL query that answers the question.
    Every time you create a sql query you should reply in the following format: 'SQL_QUERY: ' followed by the SQL query without any further formatting, just the plain one lined query.
    If asked for sample queries or a similar question where examples are asked do not format the response, do not add the SQL_QUERY prefix.
    When asked about what can be done, give a general response about the capabilities of the assistant based on the loaded DB model.
    When asked about the idea behind a presented result do not add the SQL_QUERY prefix anywhere in the response.
    `,
  }

  const dbModelMessage: ChatCompletionMessageParam = {
    "role": "system",
    "content": `
    The following is the DB model that you should use to answer questions or create the SQL queries, it is an array of objects with the following structure: { table_schema: string, table_name: string, column_name: string } where table_schema is the schema name, table_name is the table name and column_name is the column name.
    ${dbModel?.map((model) => JSON.stringify(model)).join('\n')}
    For all the SQL queries you should use the public schema. Do not create destructive queries. Be careful to not confuse the word table, unless it's explicit said otherwise, the word table will always reference the DB Tables and not the object named table.
    `,
  }

  if (dbModel?.length) {
    return [systemMessage, dbModelMessage, ...history,  message];
  }

  return [systemMessage, ...history, message];
}

const askGPT = async (message: ChatCompletionMessageParam, history: ChatCompletionMessageParam[]) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [...history, message],
  });

  return completion;
}
