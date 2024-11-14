"use client";
import { useState } from 'react';
import ChatScreen from './ChatScreen';
import TableListPanel from './components/TableListPanel';

export default function Home() {
  const [tables, setTables] = useState<string[]>([]);

  return (
    <div className="App flex flex-row">
      {tables.length > 0 && <TableListPanel tables={tables} />}
      <ChatScreen setTables={setTables} />
    </div>
  );
}
