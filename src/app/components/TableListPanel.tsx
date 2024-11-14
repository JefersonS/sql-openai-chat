type TableListPanelProps = {
  tables: string[];
};

const TableListPanel = ({ tables }: TableListPanelProps) => {
  return (
    <div className="absolute m-2 w-[200px] bg-white shadow-lg rounded-lg p-4 border border-gray-200 hidden sm:block">
      <h1 className="text-lg font-semibold mb-4">Found Tables:</h1>
      {tables.length > 0 ? (
        tables.map((table, index) => (
          <p
            key={index}
            className="p-2 rounded-md hover:bg-gray-100 transition cursor-pointer"
          >
            {table}
          </p>
        ))
      ) : (
        <p className="text-gray-500 italic">No tables found</p>
      )}
    </div>
  );
};

export default TableListPanel;
