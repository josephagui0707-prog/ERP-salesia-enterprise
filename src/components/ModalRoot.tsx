export default function ModalRoot() {
  return (
    <dialog id="dialog" aria-labelledby="dialog-title">
      <div className="modal-head">
        <div>
          <div className="eyebrow">SALESIA ENTERPRISE</div>
          <h2 id="dialog-title" />
        </div>
        <button className="icon-button" data-action="close" aria-label="Cerrar ventana">×</button>
      </div>
      <div id="dialog-body" />
    </dialog>
  );
}
