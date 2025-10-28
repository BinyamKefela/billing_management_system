"use client";

import React, { useEffect, useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface GenericDataTableProps<T> {
  endpoint: string;
  token?: string; // Optional JWT
  initialColumns: TableColumn<T>[];
}

export default function GenericDataTable<T extends Record<string, any>>({
  endpoint,
  token,
  initialColumns,
}: GenericDataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [pending, setPending] = useState(true);

  // column management
  //const [allColumns, setAllColumns] = useState<TableColumn<T>[]>(initialColumns);
  const [visibleColumns, setVisibleColumns] = useState<TableColumn<T>[]>(initialColumns);

  // fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setPending(true);
        const res = await fetch(endpoint, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        setData(json.results || json.data || []);
        setTotalRows(json.count || 0);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setPending(false);
      }
    };
    fetchData();
  }, [endpoint, token]);

  // toggle column visibility
  const handleToggleColumn = (col: TableColumn<T>) => {
    if (visibleColumns.includes(col)) {
      setVisibleColumns(visibleColumns.filter((c) => c !== col));
    } else {
      setVisibleColumns([...visibleColumns, col]);
    }
  };

  return (
    <div className="p-4">
      {/* Dropdown for column selection */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Select Columns</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {allColumns.map((col) => (
            <DropdownMenuCheckboxItem
              key={col.name as string}
              checked={visibleColumns.includes(col)}
              onCheckedChange={() => handleToggleColumn(col)}
            >
              {col.name as string}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Data Table */}
      <DataTable
      className="border-1 border-black p-4 mt-5"
        columns={visibleColumns}
        data={data}
        progressPending={pending}
        pagination
        paginationTotalRows={totalRows}
        highlightOnHover
        responsive
        paginationPerPage={5}
        paginationRowsPerPageOptions={[5,10,15,25]}
    
      />
    </div>
  );
}
