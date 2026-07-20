"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  actionLabel,
  buildPermissionMatrix,
  matrixActionColumns,
  type PermissionRecord,
} from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PermissionMatrixProps = {
  permissions: PermissionRecord[];
  selectedIds: string[];
  onChange?: (ids: string[]) => void;
  readOnly?: boolean;
};

export function PermissionMatrix({
  permissions,
  selectedIds,
  onChange,
  readOnly = false,
}: PermissionMatrixProps) {
  const matrix = useMemo(() => buildPermissionMatrix(permissions), [permissions]);
  const actionColumns = useMemo(() => matrixActionColumns(permissions), [permissions]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allIds = useMemo(() => permissions.map((p) => p.id), [permissions]);

  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () => new Set(matrix.map((m) => m.module)),
  );

  const toggleModule = (module: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  };

  const expandAll = () => setExpandedModules(new Set(matrix.map((m) => m.module)));
  const collapseAll = () => setExpandedModules(new Set());

  const setSelected = (ids: string[]) => {
    if (!readOnly && onChange) onChange(ids);
  };

  const togglePermission = (id: string) => {
    if (readOnly || !onChange) return;
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  const toggleMany = (ids: string[], select: boolean) => {
    if (readOnly || !onChange) return;
    const next = new Set(selectedSet);
    for (const id of ids) {
      if (select) next.add(id);
      else next.delete(id);
    }
    onChange(Array.from(next));
  };

  const modulePermissionIds = (moduleName: string) => {
    const mod = matrix.find((m) => m.module === moduleName);
    if (!mod) return [];
    return mod.features.flatMap((f) =>
      Object.values(f.cells)
        .filter(Boolean)
        .map((c) => c!.id),
    );
  };

  const featurePermissionIds = (moduleName: string, featureName: string) => {
    const mod = matrix.find((m) => m.module === moduleName);
    const feature = mod?.features.find((f) => f.feature === featureName);
    if (!feature) return [];
    return Object.values(feature.cells)
      .filter(Boolean)
      .map((c) => c!.id);
  };

  const allSelected = allIds.length > 0 && allIds.every((id) => selectedSet.has(id));
  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toggleMany(allIds, !allSelected)}
          >
            {allSelected ? "Deselect all" : "Select all"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={expandAll}>
            Expand all
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={collapseAll}>
            Collapse all
          </Button>
          <span className="text-xs text-muted-foreground">
            {selectedSet.size} of {allIds.length} selected
          </span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-3 py-2 text-left font-medium">Module / Feature</th>
              {actionColumns.map((action) => (
                <th key={action} className="px-2 py-2 text-center font-medium">
                  {actionLabel(action)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((mod) => {
              const modIds = modulePermissionIds(mod.module);
              const modExpanded = expandedModules.has(mod.module);
              const modAllSelected = modIds.length > 0 && modIds.every((id) => selectedSet.has(id));
              const modSomeSelected = modIds.some((id) => selectedSet.has(id));

              return (
                <Fragment key={mod.module}>
                  <tr className="border-b border-border bg-muted/20">
                    <td className="px-3 py-2" colSpan={actionColumns.length + 1}>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded p-0.5 hover:bg-muted"
                          onClick={() => toggleModule(mod.module)}
                          aria-expanded={modExpanded}
                        >
                          {modExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <span className="font-semibold">{mod.module}</span>
                        {!readOnly && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-7 text-xs"
                            onClick={() => toggleMany(modIds, !modAllSelected)}
                          >
                            {modAllSelected ? "Deselect module" : modSomeSelected ? "Select module" : "Select module"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {modExpanded &&
                    mod.features.map((row) => {
                      const rowIds = featurePermissionIds(mod.module, row.feature);
                      const rowAllSelected =
                        rowIds.length > 0 && rowIds.every((id) => selectedSet.has(id));

                      return (
                        <tr key={`${mod.module}-${row.feature}`} className="border-b border-border/60">
                          <td className="px-3 py-2 pl-10">
                            <div className="flex items-center justify-between gap-2">
                              <span>{row.feature}</span>
                              {!readOnly && rowIds.length > 0 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => toggleMany(rowIds, !rowAllSelected)}
                                >
                                  {rowAllSelected ? "Clear" : "All"}
                                </Button>
                              )}
                            </div>
                          </td>
                          {actionColumns.map((action) => {
                            const perm = row.cells[action];
                            if (!perm) {
                              return (
                                <td key={action} className="px-2 py-2 text-center text-muted-foreground">
                                  —
                                </td>
                              );
                            }
                            const checked = selectedSet.has(perm.id);
                            return (
                              <td key={action} className="px-2 py-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={readOnly}
                                  onChange={() => togglePermission(perm.id)}
                                  className={cn(
                                    "h-4 w-4 rounded border-border accent-primary",
                                    readOnly && "cursor-default opacity-80",
                                  )}
                                  aria-label={`${row.feature} ${actionLabel(action)}`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {readOnly && (
        <p className="text-xs text-muted-foreground">
          {selectedSet.size} permission{selectedSet.size === 1 ? "" : "s"} assigned to this role.
        </p>
      )}
    </div>
  );
}
