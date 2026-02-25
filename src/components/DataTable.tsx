import { ReactNode } from "react";

type CellAlign = "left" | "center" | "right";

export type DataTableColumn<T> = {
  field: string;
  header: ReactNode;
  align?: CellAlign;
  headerAlign?: CellAlign;
  width?: number | string;
  className?: string;
  headerClassName?: string;
  render?: (row: T, rowIndex: number) => ReactNode;
};

type RowMeta = {
  dataType?: string;
  colSpan?: Record<string, number>;
  align?: Record<string, CellAlign>;
  className?: string;
};

type Props<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey?: keyof T | ((row: T, index: number) => string);
  emptyMessage?: ReactNode;
  className?: string;
};

function getRowKey<T>(row: T, index: number, rowKey?: keyof T | ((row: T, index: number) => string)) {
  if (typeof rowKey === "function") return rowKey(row, index);
  if (rowKey && row[rowKey] != null) return String(row[rowKey]);
  return String(index);
}

function getMeta<T>(row: T): RowMeta {
  const candidate = row as RowMeta;
  return {
    dataType: candidate.dataType,
    colSpan: candidate.colSpan,
    align: candidate.align,
    className: candidate.className,
  };
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  className,
}: Props<T>) {
  return (
    <div className="data-table-wrap">
      <table className={`data-table ${className ?? ""}`.trim()}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.field}
                className={col.headerClassName}
                style={{ textAlign: col.headerAlign ?? col.align ?? "left", width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{emptyMessage ?? "No records found."}</td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => {
              const meta = getMeta(row);
              let skip = 0;
              const rowTypeClass = meta.dataType ? `dt-row--${meta.dataType}` : "";

              return (
                <tr
                  key={getRowKey(row, rowIndex, rowKey)}
                  className={[rowTypeClass, meta.className].filter(Boolean).join(" ")}
                >
                  {columns.map((col) => {
                    if (skip > 0) {
                      skip -= 1;
                      return null;
                    }

                    const colSpan = Math.max(1, meta.colSpan?.[col.field] ?? 1);
                    skip = colSpan - 1;

                    return (
                      <td
                        key={`${col.field}-${rowIndex}`}
                        colSpan={colSpan}
                        className={col.className}
                        style={{ textAlign: meta.align?.[col.field] ?? col.align ?? "left" }}
                      >
                        {col.render ? col.render(row, rowIndex) : ((row as Record<string, ReactNode>)[col.field] ?? "")}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
