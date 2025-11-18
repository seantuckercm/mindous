'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Table, 
  Play, 
  Save, 
  RefreshCw, 
  ChevronRight,
  ChevronDown,
  Columns3,
  Key,
  FileJson,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamically import react-data-grid to avoid SSR issues
const DataGrid = dynamic(() => import('react-data-grid'), {
  ssr: false,
  loading: () => <div className="p-4 text-center text-muted-foreground">Loading data grid...</div>
});

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  primary: boolean;
  unique: boolean;
  defaultValue?: string;
}

interface TableSchema {
  name: string;
  columns: Column[];
  rowCount: number;
}

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowsAffected?: number;
  executionTime: number;
  error?: string;
}

interface DatabaseViewerProps {
  sessionId: string;
  className?: string;
}

export function DatabaseViewer({ sessionId, className }: DatabaseViewerProps) {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableSchema | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM table_name LIMIT 100;');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [currentTab, setCurrentTab] = useState<'schema' | 'data' | 'query'>('schema');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(100);

  // Fetch database schema
  const fetchSchema = async () => {
    try {
      const response = await fetch(`/api/archagent/database/schema?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setTables(data.tables || []);
        
        // Auto-select first table
        if (!selectedTable && data.tables?.length > 0) {
          setSelectedTable(data.tables[0]);
          fetchTableData(data.tables[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch schema:', error);
    }
  };

  // Fetch table data
  const fetchTableData = async (tableName: string, pageNum: number = 0) => {
    try {
      const response = await fetch(
        `/api/archagent/database/data?sessionId=${sessionId}&table=${tableName}&page=${pageNum}&limit=${pageSize}`
      );
      if (response.ok) {
        const data = await response.json();
        setTableData(data.rows || []);
      }
    } catch (error) {
      console.error('Failed to fetch table data:', error);
    }
  };

  // Execute SQL query
  const executeQuery = async () => {
    if (!sqlQuery.trim()) return;

    setIsExecuting(true);
    setQueryResult(null);

    try {
      const startTime = Date.now();
      const response = await fetch(`/api/archagent/database/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, query: sqlQuery }),
      });

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      if (response.ok) {
        setQueryResult({
          ...data,
          executionTime,
        });
      } else {
        setQueryResult({
          columns: [],
          rows: [],
          executionTime,
          error: data.error || 'Query execution failed',
        });
      }
    } catch (error) {
      setQueryResult({
        columns: [],
        rows: [],
        executionTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchSchema();
  }, [sessionId]);

  // Toggle table expansion
  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  // Handle table selection
  const handleTableSelect = (table: TableSchema) => {
    setSelectedTable(table);
    setCurrentTab('data');
    setPage(0);
    fetchTableData(table.name, 0);
    setSqlQuery(`SELECT * FROM ${table.name} LIMIT 100;`);
  };

  // Convert table data to DataGrid format
  const gridColumns = useMemo(() => {
    if (!selectedTable) return [];
    return selectedTable.columns.map(col => ({
      key: col.name,
      name: col.name,
      resizable: true,
      sortable: true,
      width: 150,
    }));
  }, [selectedTable]);

  const gridRows = useMemo(() => {
    return tableData.map((row, idx) => ({
      id: idx,
      ...row,
    }));
  }, [tableData]);

  // Convert query result to DataGrid format
  const queryGridColumns = useMemo(() => {
    if (!queryResult || queryResult.error) return [];
    return queryResult.columns.map(col => ({
      key: col,
      name: col,
      resizable: true,
      sortable: true,
      width: 150,
    }));
  }, [queryResult]);

  const queryGridRows = useMemo(() => {
    if (!queryResult || queryResult.error) return [];
    return queryResult.rows.map((row, idx) => {
      const rowObj: any = { id: idx };
      queryResult.columns.forEach((col, colIdx) => {
        rowObj[col] = row[colIdx];
      });
      return rowObj;
    });
  }, [queryResult]);

  // Render table schema tree
  const renderTableNode = (table: TableSchema) => {
    const isExpanded = expandedTables.has(table.name);
    const isSelected = selectedTable?.name === table.name;

    return (
      <div key={table.name} className="mb-1">
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm transition-colors',
            isSelected && 'bg-accent'
          )}
          onClick={() => handleTableSelect(table)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTable(table.name);
            }}
            className="p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <Table className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium flex-1">{table.name}</span>
          <Badge variant="secondary" className="text-xs">
            {table.rowCount}
          </Badge>
        </div>

        {isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {table.columns.map(col => (
              <div
                key={col.name}
                className="flex items-center gap-2 px-2 py-1 text-xs"
              >
                {col.primary ? (
                  <Key className="h-3 w-3 text-yellow-500" />
                ) : (
                  <Columns3 className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="flex-1 truncate">{col.name}</span>
                <Badge variant="outline" className="text-xs">
                  {col.type}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">Database Viewer</CardTitle>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Table className="h-3 w-3" />
                {tables.length} tables
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSchema}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="flex h-full">
            {/* Tables Sidebar */}
            <div className="w-64 border-r flex flex-col">
              <div className="p-3 border-b bg-muted/50">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tables</span>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {tables.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No tables found
                    </div>
                  ) : (
                    tables.map(renderTableNode)
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              {selectedTable ? (
                <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)} className="flex-1 flex flex-col">
                  <div className="border-b px-3 py-2 flex items-center justify-between bg-muted/50">
                    <TabsList>
                      <TabsTrigger value="schema" className="text-xs">
                        Schema
                      </TabsTrigger>
                      <TabsTrigger value="data" className="text-xs">
                        Data
                      </TabsTrigger>
                      <TabsTrigger value="query" className="text-xs">
                        SQL Query
                      </TabsTrigger>
                    </TabsList>
                    <span className="text-sm font-medium">{selectedTable.name}</span>
                  </div>

                  <TabsContent value="schema" className="flex-1 m-0 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="p-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Table Information</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Name:</span>
                                <span className="ml-2 font-medium">{selectedTable.name}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Rows:</span>
                                <span className="ml-2 font-medium">{selectedTable.rowCount}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Columns:</span>
                                <span className="ml-2 font-medium">{selectedTable.columns.length}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium mb-2">Columns</h4>
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-muted">
                                  <tr>
                                    <th className="text-left p-2 font-medium">Name</th>
                                    <th className="text-left p-2 font-medium">Type</th>
                                    <th className="text-left p-2 font-medium">Constraints</th>
                                    <th className="text-left p-2 font-medium">Default</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedTable.columns.map((col, idx) => (
                                    <tr key={col.name} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                                      <td className="p-2 flex items-center gap-2">
                                        {col.primary && <Key className="h-3 w-3 text-yellow-500" />}
                                        <span className="font-mono">{col.name}</span>
                                      </td>
                                      <td className="p-2">
                                        <Badge variant="secondary" className="text-xs">
                                          {col.type}
                                        </Badge>
                                      </td>
                                      <td className="p-2">
                                        <div className="flex gap-1">
                                          {col.primary && <Badge variant="outline" className="text-xs">PRIMARY</Badge>}
                                          {col.unique && <Badge variant="outline" className="text-xs">UNIQUE</Badge>}
                                          {!col.nullable && <Badge variant="outline" className="text-xs">NOT NULL</Badge>}
                                        </div>
                                      </td>
                                      <td className="p-2 text-muted-foreground">
                                        {col.defaultValue || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="data" className="flex-1 m-0 overflow-hidden">
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
                        <span className="text-sm text-muted-foreground">
                          Showing {gridRows.length} rows
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newPage = Math.max(0, page - 1);
                              setPage(newPage);
                              fetchTableData(selectedTable.name, newPage);
                            }}
                            disabled={page === 0}
                          >
                            Previous
                          </Button>
                          <span className="text-sm">Page {page + 1}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newPage = page + 1;
                              setPage(newPage);
                              fetchTableData(selectedTable.name, newPage);
                            }}
                            disabled={gridRows.length < pageSize}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1" style={{ minHeight: 0 }}>
                        {gridColumns.length > 0 && (
                          <DataGrid
                            columns={gridColumns}
                            rows={gridRows}
                            className="rdg-light"
                            style={{ height: '100%' }}
                          />
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="query" className="flex-1 m-0 overflow-hidden flex flex-col">
                    <div className="p-3 border-b space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">SQL Query</label>
                        <Textarea
                          value={sqlQuery}
                          onChange={(e) => setSqlQuery(e.target.value)}
                          placeholder="Enter your SQL query here..."
                          className="font-mono text-sm min-h-[100px]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={executeQuery}
                          disabled={isExecuting || !sqlQuery.trim()}
                          className="gap-2"
                        >
                          <Play className={cn('h-4 w-4', isExecuting && 'animate-spin')} />
                          {isExecuting ? 'Executing...' : 'Execute Query'}
                        </Button>
                        {queryResult && (
                          <Badge variant={queryResult.error ? 'destructive' : 'default'} className="gap-1">
                            {queryResult.error ? (
                              <>
                                <AlertCircle className="h-3 w-3" />
                                Error
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                Success ({queryResult.executionTime}ms)
                              </>
                            )}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 overflow-hidden">
                      {queryResult && (
                        <div className="h-full flex flex-col">
                          {queryResult.error ? (
                            <div className="p-4">
                              <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                                <p className="text-sm text-destructive font-medium">{queryResult.error}</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="p-2 border-b bg-muted/50 text-sm text-muted-foreground">
                                {queryResult.rows.length} rows returned
                                {queryResult.rowsAffected !== undefined && ` • ${queryResult.rowsAffected} rows affected`}
                              </div>
                              <div className="flex-1" style={{ minHeight: 0 }}>
                                {queryGridColumns.length > 0 && (
                                  <DataGrid
                                    columns={queryGridColumns}
                                    rows={queryGridRows}
                                    className="rdg-light"
                                    style={{ height: '100%' }}
                                  />
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {!queryResult && (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <FileJson className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Execute a query to see results</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
                  <Database className="h-16 w-16 opacity-50" />
                  <div className="text-center">
                    <p className="text-lg font-medium">No Table Selected</p>
                    <p className="text-sm mt-2">
                      {tables.length === 0 
                        ? 'No database tables found'
                        : 'Select a table from the sidebar to view'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
