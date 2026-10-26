import React from 'react';

interface AffidavitModalProps {
  order: any;
  user: any;
  affidavitText?: string;
  onClose: () => void;
  onFlash: (msg: string, isError?: boolean) => void;
}

export const AffidavitModal: React.FC<AffidavitModalProps> = ({
  order,
  user,
  affidavitText,
  onClose,
  onFlash
}) => {
  if (!order) return null;

  const companyName = user?.agency || 'Process Servers Solution';
  const serverName = order.assigned_server_name || user?.full_name || 'Authorized Process Server';

  const defaultText = `STATE OF NORTH CAROLINA\nCOUNTY OF SERVICE RECORD\n\nIN THE DISTRICT COURT DIVISION\nCAUSE NO: ${order.causeNumber || order.caseNumber || `CV-${order.id}`}\n\n${order.title}\n\n=======================================================\nAFFIDAVIT OF DUE AND DILIGENT SERVICE\n=======================================================\n\nI, ${serverName}, having been first duly sworn according to law, depose and certify under penalty of perjury as follows:\n\n1. I am a citizen of the United States, over 18 years of age, not a party to this action, and legally authorized to execute service of process for ${companyName}.\n\n2. I received the legal process documents in this cause for service upon the designated subject:\n   ENTITY/PERSON: ${order.entityBeingServed || order.title}\n   SERVICE ADDRESS: ${order.serviceAddress || 'Recorded Service Address'}\n\n3. SERVICE LOG & DUE DILIGENCE ATTEMPTS:\n${
    order.attempts && order.attempts.length > 0
      ? order.attempts
          .map(
            (a: any, i: number) =>
              `   Attempt #${i + 1} [${a.date} ${a.time}]: ${a.notes} (Outcome: ${String(a.outcome).toUpperCase()}${
                a.physicalDescription ? ` - Recipient Description: ${a.physicalDescription}` : ''
              })`
          )
          .join('\n')
      : '   Personal delivery executed in full accordance with statutory rules of civil procedure.'
  }\n\n4. RETURN OF SERVICE:\nI executed due service of process by delivering a true and correct copy of the legal summons, petition/complaint, and all accompanying court instruments.\n\nRespectfully submitted,\nSignature: /s/ ${serverName}\nExecuting Agency: ${companyName}\nDate: ${new Date().toLocaleDateString('en-US')}\nTime: ${new Date().toLocaleTimeString('en-US')}`;

  const textToDisplay = affidavitText || defaultText;

  const handleCopy = () => {
    navigator.clipboard.writeText(textToDisplay);
    onFlash('Affidavit draft copied to clipboard.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="order-modal-backdrop" onClick={onClose}>
      <div
        className="order-modal max-w-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Affidavit of Service"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="order-modal__head">
          <div>
            <p className="order-modal__eyebrow">Legal Document</p>
            <h2>Affidavit of Service — Order #{order.id}</h2>
          </div>
          <button
            type="button"
            className="icon-close"
            aria-label="Close"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg my-3 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-900 max-h-[60vh] overflow-y-auto select-all shadow-inner">
          {textToDisplay}
        </div>

        <div className="order-modal__footer">
          <button type="button" className="primary" onClick={handleCopy}>
            Copy Text
          </button>
          <button type="button" onClick={handlePrint}>
            Print / PDF
          </button>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
