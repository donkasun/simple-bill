import React from "react";
import StyledTable from "@components/core/StyledTable";
import Button from "@components/core/Button";
import ItemModal from "@components/items/ItemModal";
import ConfirmDialog from "@components/core/ConfirmDialog";
import { usePageTitle } from "@components/layout/PageTitleContext";
import PageHeader from "@components/layout/PageHeader";
import ItemEmptyState from "@components/items/ItemEmptyState";
import { useItemsPage } from "@hooks/pages/useItemsPage";

const Items: React.FC = () => {
  usePageTitle("Products & services");
  const vm = useItemsPage();

  return (
    <div className="app-page">
      <PageHeader
        title={vm.title}
        subtitle="What you sell and the rates you charge."
        actions={<Button onClick={vm.actions.openAdd}>Add item</Button>}
      />

      {vm.loading && <div>Loading items…</div>}
      {vm.error && (
        <div role="alert" style={{ color: "crimson" }}>
          {vm.error}
        </div>
      )}

      {vm.showItemsTable && (
        <React.Fragment>
          {!vm.empty ? (
            <StyledTable>
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="td-right">Unit Price</th>
                  <th>Description</th>
                  <th className="td-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vm.items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.name}</td>
                    <td className="td-right">{it.unitPriceLabel}</td>
                    <td>
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {it.description ?? "-"}
                      </div>
                    </td>
                    <td className="td-right">
                      <div className="actions">
                        <button
                          type="button"
                          className="link-btn"
                          style={{ minHeight: "44px" }}
                          onClick={() => vm.actions.openEdit(it)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn-danger"
                          aria-label={
                            vm.deleteConfirm.deletingId === it.id
                              ? "Deleting item"
                              : "Delete item"
                          }
                          title="Delete item"
                          disabled={vm.deleteConfirm.deletingId === it.id}
                          onClick={() =>
                            it.id && vm.actions.requestDelete(it.id)
                          }
                        >
                          <span
                            className="material-symbols-outlined"
                            aria-hidden
                          >
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          ) : (
            <ItemEmptyState onAddClick={vm.actions.openAdd} />
          )}
        </React.Fragment>
      )}

      <ConfirmDialog
        isOpen={vm.deleteConfirm.open}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={vm.actions.confirmDelete}
        onCancel={vm.actions.cancelDelete}
        danger
      />

      <ItemModal
        open={vm.modal.open}
        title={vm.modal.title}
        initial={vm.modal.initial}
        submitting={vm.modal.submitting}
        onSubmit={vm.actions.submitItem}
        onCancel={vm.actions.closeModal}
      />
    </div>
  );
};

export default Items;
