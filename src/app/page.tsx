"use client";
import { useState } from 'react';
import ChatScreen from './ChatScreen';

export default function Home() {
  const [tables, setTables] = useState<string[]>([]);

  return (
    <div className="App flex flex-row">
      <div className='m-2 w-[150px]' onClick={() => alert(tables)}>
        <h1>Found tables: </h1>
        {tables.map((table, index) => <p key={index}>{table}</p>)}
      </div>
      <ChatScreen setTables={setTables} />
    </div>
  );
}
