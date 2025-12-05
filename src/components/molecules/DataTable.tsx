import React, { useState } from 'react';
import Text from '@/components/atoms/Text';
import Button from '@/components/atoms/Button';

interface Column {
  key: string;
  title: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  onRowClick?: (item: any) => void;
  showPagination?: boolean;
  pageSize?: number;
  className?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  onRowClick,
  showPagination = true,
  pageSize = 10,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // If pagination is enabled, calculate the data to display
  const paginatedData = showPagination
    ? data.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : data;

  const totalPages = Math.ceil(data.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className={`overflow-x-auto rounded-lg border ${className}`}>
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/30">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {paginatedData.length > 0 ? (
            paginatedData.map((item, index) => (
              <tr
                key={item.id || index}
                className={`hover:bg-accent/30 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {column.render
                      ? column.render(item[column.key], item)
                      : item[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-muted-foreground">
                No hay datos disponibles
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showPagination && data.length > pageSize && (
        <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <Text variant="body">
                Mostrando <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> a{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, data.length)}</span> de{' '}
                <span className="font-medium">{data.length}</span> resultados
              </Text>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md text-sm font-medium"
                >
                  <span className="sr-only">Anterior</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>

                {/* Smart Pagination */}
                {(() => {
                  const windowSize = 5; // Number of pages to show around current
                  const pages = [];

                  if (totalPages <= 7) {
                    // Show all if few pages
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    // Always show first
                    pages.push(1);

                    if (currentPage > 3) {
                      pages.push('...');
                    }

                    // Center window
                    const start = Math.max(2, currentPage - 1);
                    const end = Math.min(totalPages - 1, currentPage + 1);

                    for (let i = start; i <= end; i++) {
                      if (i > 1 && i < totalPages) pages.push(i);
                    }

                    if (currentPage < totalPages - 2) {
                      pages.push('...');
                    }

                    // Always show last
                    pages.push(totalPages);
                  }

                  return pages.map((page, index) => (
                    <React.Fragment key={index}>
                      {page === '...' ? (
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                          ...
                        </span>
                      ) : (
                        <Button
                          variant={currentPage === page ? 'secondary' : 'outline'}
                          onClick={() => handlePageChange(page as number)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${currentPage === page
                              ? 'z-10 bg-primary text-primary-foreground border-primary'
                              : ''
                            }`}
                        >
                          {page}
                        </Button>
                      )}
                    </React.Fragment>
                  ));
                })()}

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md text-sm font-medium"
                >
                  <span className="sr-only">Siguiente</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;