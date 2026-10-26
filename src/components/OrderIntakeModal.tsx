import React, { useState, useMemo, useEffect } from 'react';

const US_STATES = 'AL.AK.AZ.AR.CA.CO.CT.DE.FL.GA.HI.ID.IL.IN.IA.KS.KY.LA.ME.MD.MA.MI.MN.MS.MO.MT.NE.NV.NH.NJ.NM.NY.NC.ND.OH.OK.OR.PA.RI.SC.SD.TN.TX.UT.VT.VA.WA.WV.WI.WY.DC'.split('.');

export const PRICE_SHEET_ITEMS = [
  { id: 'std-3', orderType: 'Process Service', name: 'Standard Service - 3 Attempts', description: 'A standard service includes 3 attempts', price: 75, taxRate: 0 },
  { id: 'addl', orderType: 'Process Service', name: 'Additional Attempts', description: 'Additional attempts after 3rd attempt', price: 25, taxRate: 0 },
  { id: 'filing-trip', orderType: 'Process Service', name: 'Filing Trip Fee', description: 'Filing trip fee', price: 50, taxRate: 0 },
  { id: 'filing-fee', orderType: 'Process Service', name: 'Filing fee (varying rates)', description: 'Filing fee is dependent on the charge to file', price: 0, taxRate: 0 },
  { id: 'extended', orderType: 'Process Service', name: 'Extended Area', description: 'Extended area charge', price: 0, taxRate: 0 }
];

export const ITEMS_TO_SERVE = [
  'CITATION',
  'CITATION CORPORATE',
  "PLAINTIFF'S ORIGINAL PETITION",
  "PLAINTIFF'S FIRST AMENDED PETITION",
  'SUMMONS',
  'ORIGINAL COMPLAINT',
  'FIRST AMENDED COMPLAINT',
  'ORDER GRANTING ALTERNATE SERVICE',
  'NOTICE OF HEARING BEFORE SPECIAL COMMISSIONERS',
  'NOTICE OF HEARING',
  'SUBPOENA TO PRODUCE DOCUMENTS',
  'SUBPOENA FOR DEPOSITION ON WRITTEN QUESTIONS',
  'SUBPOENA FOR DEPOSITION',
  'SUBPOENA FOR TRIAL',
  'TEMPORARY RESTRAINING ORDER',
  'SHOW CAUSE ORDER',
  'PRECEPT',
  'REDEMPTION',
  'EVICTION',
  'FORECLOSURE',
  'REQUEST FOR PRODUCTION',
  'HAND DELIVERY CONSTABLE SERVICE',
  'HAND DELIVERY OF ORAL HEARING'
];

const PRICE_SHEET_DESCRIPTIONS: Record<string, string> = {
  Standard: 'This is the standard price sheet for all new customers.',
  Premium: 'Premium pricing for rush and specialty service packages.',
  Custom: 'Custom negotiated rates for this customer account.'
};

const HELPFUL_TIP =
  'Helpful Tip: There are two tabs to gather information about new orders: The Customer tab is used to select the customer for this order. If the customer does not appear in the drop down list, you will need to enter the customer and user info on the customer tab. Once the customer is entered and saved the Customer will appear in the drop down menu and the information fields will auto-fill. The Details tab is used to enter information about a specific order.';

function padZero(n: number) {
  return String(n).padStart(2, '0');
}

function getCurrentDateTimeCluster() {
  const now = new Date();
  let hr = now.getHours();
  const ampm = hr >= 12 ? 'PM' : 'AM';
  hr = hr % 12;
  if (hr === 0) hr = 12;
  return {
    date: `${now.getFullYear()}-${padZero(now.getMonth() + 1)}-${padZero(now.getDate())}`,
    hour: String(hr),
    min: padZero(now.getMinutes()),
    ampm
  };
}

interface OrderIntakeModalProps {
  open: boolean;
  role: string;
  clients: any[];
  servers: any[];
  users: any[];
  orders: any[];
  onClose: () => void;
  onSubmit: (orderData: any) => Promise<void>;
  onFlash: (msg: string, isError?: boolean) => void;
}

export const OrderIntakeModal: React.FC<OrderIntakeModalProps> = ({
  open,
  role,
  clients = [],
  servers = [],
  users = [],
  orders = [],
  onClose,
  onSubmit,
  onFlash
}) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'details'>('customer');
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);
  const [copyOrderId, setCopyOrderId] = useState('');
  const [selectedCustomerKey, setSelectedCustomerKey] = useState('');
  const [loading, setLoading] = useState(false);

  // Customer State
  const [customer, setCustomer] = useState({
    customerId: '',
    name: '',
    address1: '',
    address2: '',
    address3: '',
    city: '',
    state: 'NC',
    zip: '',
    contact: '',
    contactEmail: '',
    phone1: '',
    phone2: '',
    fax: '',
    comment: '',
    alert: '',
    priceSheet: 'Standard',
    linkedUserId: undefined as number | undefined
  });

  // Selected Price Sheet lines
  const [selectedPriceSheetIds, setSelectedPriceSheetIds] = useState<string[]>(['std-3']);

  // Details Tab State
  const [details, setDetails] = useState({
    orderStatus: 'Pending',
    closedStatus: 'NA',
    responsiblePartyId: '',
    orderedById: '',
    dateReceived: '',
    dateReceivedHour: '',
    dateReceivedMin: '',
    dateReceivedAmPm: 'AM',
    serviceSpeed: 'Standard',
    dueDate: '',
    clientMatter: '',
    plaintiffName: '',
    defendantName: '',
    causeNumber: '',
    courtInfo: '',
    entityBeingServed: '',
    serviceAddress: '',
    city: '',
    county: '',
    state: 'NC',
    zip: '',
    processServerId: '',
    filingDate: '',
    filingFee: '',
    estimatedAmount: '',
    mannerOfService: '',
    itemsBeingServed: [] as string[],
    otherItems: '',
    officeNotes: '',
    serviceInstructions: '',
    subpoenaCounty: '',
    subpoenaLocationName: '',
    subpoenaLocationAddress: '',
    subpoenaDate: '',
    subpoenaTime: '',
    subpoenaRequestor: 'PLAINTIFF',
    serviceLines: [
      { id: 'std-3', qty: 1, name: 'Standard Service - 3 Attempts', comment: '', price: 75 }
    ],
    addonFees: [
      { id: 'addl', name: 'Additional Attempts', enabled: false, comment: '', price: 25 },
      { id: 'filing-trip', name: 'Filing Trip Fee', enabled: false, comment: '', price: 50 },
      { id: 'filing-fee', name: 'Filing fee (varying rates)', enabled: false, comment: '', price: 0 },
      { id: 'extended', name: 'Extended Area', enabled: false, comment: '', price: 0 }
    ]
  });

  const allKnownUsers = useMemo(() => {
    const map = new Map<number, any>();
    [...clients, ...servers, ...users].forEach((u) => {
      if (u && u.id) map.set(u.id, u);
    });
    return Array.from(map.values());
  }, [clients, servers, users]);

  if (!open) return null;

  const handleCustomerDropdownChange = (key: string) => {
    setSelectedCustomerKey(key);
    if (!key) {
      setCustomer((prev) => ({ ...prev, customerId: '', linkedUserId: undefined }));
      return;
    }
    if (key.startsWith('user:')) {
      const uid = Number(key.slice(5));
      const u = clients.find((c) => c.id === uid) || allKnownUsers.find((c) => c.id === uid);
      if (u) {
        setCustomer({
          ...customer,
          customerId: String(u.id),
          linkedUserId: u.id,
          name: u.full_name,
          contact: u.full_name,
          contactEmail: u.email,
          phone1: u.phone || customer.phone1,
          comment: u.agency ? `Agency / Firm: ${u.agency}` : customer.comment
        });
      }
    }
  };

  const handleSetCurrentDateTime = () => {
    const dt = getCurrentDateTimeCluster();
    setDetails((prev) => ({
      ...prev,
      dateReceived: dt.date,
      dateReceivedHour: dt.hour,
      dateReceivedMin: dt.min,
      dateReceivedAmPm: dt.ampm
    }));
  };

  const handleSetCurrentDateDue = () => {
    const dt = getCurrentDateTimeCluster();
    setDetails((prev) => ({
      ...prev,
      dueDate: dt.date
    }));
  };

  const toggleItemBeingServed = (item: string) => {
    setDetails((prev) => ({
      ...prev,
      itemsBeingServed: prev.itemsBeingServed.includes(item)
        ? prev.itemsBeingServed.filter((i) => i !== item)
        : [...prev.itemsBeingServed, item]
    }));
  };

  const addCustomServiceLine = () => {
    const newId = `custom-${Date.now()}`;
    setDetails((prev) => ({
      ...prev,
      serviceLines: [
        ...prev.serviceLines,
        { id: newId, qty: 1, name: 'Custom Service', comment: '', price: 50 }
      ]
    }));
  };

  const updateServiceLine = (id: string, patch: any) => {
    setDetails((prev) => ({
      ...prev,
      serviceLines: prev.serviceLines.map((line) => (line.id === id ? { ...line, ...patch } : line))
    }));
  };

  const removeServiceLine = (id: string) => {
    setDetails((prev) => ({
      ...prev,
      serviceLines: prev.serviceLines.filter((line) => line.id !== id)
    }));
  };

  const updateAddonFee = (id: string, patch: any) => {
    setDetails((prev) => ({
      ...prev,
      addonFees: prev.addonFees.map((fee) => (fee.id === id ? { ...fee, ...patch } : fee))
    }));
  };

  const handleCopyOrder = () => {
    const target = copyOrderId.trim().replace(/^#/, '');
    if (!target) {
      onFlash('Enter an order ID or case number to copy.', true);
      return;
    }
    const found = orders.find(
      (o) => String(o.id) === target || (o.title && o.title.toLowerCase().includes(target.toLowerCase()))
    );
    if (!found) {
      onFlash(`Could not find order #${target} to copy.`, true);
      return;
    }

    setDetails((prev) => ({
      ...prev,
      clientMatter: found.title || '',
      plaintiffName: found.plaintiffName || found.plaintiff || '',
      defendantName: found.defendantName || found.defendant || '',
      causeNumber: found.caseNumber || '',
      courtInfo: found.courtName || '',
      entityBeingServed: found.entityBeingServed || '',
      serviceAddress: found.serviceAddress || '',
      serviceInstructions: found.specialInstructions || found.commentsNotes || ''
    }));
    onFlash(`Copied details from Order #${found.id}.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer.name.trim() && role === 'agency_admin') {
      onFlash('Enter or select a customer on the Customer tab.', true);
      setActiveTab('customer');
      return;
    }

    let linkedClientId = customer.linkedUserId;
    if (role === 'agency_admin' && !linkedClientId) {
      // try matching by email or name
      const matched = clients.find(
        (c) =>
          (customer.contactEmail && c.email.toLowerCase() === customer.contactEmail.toLowerCase()) ||
          (customer.name && c.full_name.toLowerCase() === customer.name.toLowerCase())
      );
      if (matched) linkedClientId = matched.id;
      else if (clients[0]) linkedClientId = clients[0].id;
    }

    const caseTitle =
      [details.plaintiffName, details.defendantName].filter(Boolean).join(' v. ') ||
      details.clientMatter.trim() ||
      details.entityBeingServed.trim() ||
      `${customer.name.trim() || 'Service Client'} — ${details.serviceSpeed} Service`;

    const fullDetailsText = [
      `=== CUSTOMER ===`,
      `Customer ID: ${customer.customerId || '(new)'}`,
      `Customer Name: ${customer.name}`,
      `Address: ${[customer.address1, customer.address2, customer.address3].filter(Boolean).join(', ')}`,
      `City/State/Zip: ${customer.city}, ${customer.state} ${customer.zip}`,
      `Contact: ${customer.contact}`,
      `Email: ${customer.contactEmail}`,
      `Phone: ${customer.phone1}`,
      `Price Sheet: ${customer.priceSheet}`,
      ``,
      `=== ORDER DETAILS ===`,
      `Status: ${details.orderStatus}`,
      `Service Speed: ${details.serviceSpeed}`,
      `Due Date: ${details.dueDate}`,
      `Cause Number: ${details.causeNumber}`,
      `Court Info: ${details.courtInfo}`,
      `Entity Being Served: ${details.entityBeingServed}`,
      `Service Address: ${details.serviceAddress}, ${details.city}, ${details.county}, ${details.state} ${details.zip}`,
      `Manner of Service: ${details.mannerOfService}`,
      `Items Being Served: ${details.itemsBeingServed.join('; ') || '(none)'}`,
      `Service Instructions: ${details.serviceInstructions}`,
      ``,
      `=== SERVICES ===`,
      ...details.serviceLines.map((l) => `- qty ${l.qty} · ${l.name} — $${l.price.toFixed(2)}`),
      ...details.addonFees.filter((a) => a.enabled).map((a) => `- ADDON ${a.name} — $${a.price.toFixed(2)}`)
    ].join('\n');

    setLoading(true);
    try {
      await onSubmit({
        title: caseTitle,
        details: fullDetailsText,
        deadline: details.dueDate ? `${details.dueDate}T17:00` : undefined,
        clientId: linkedClientId,
        customerJson: JSON.stringify(customer),
        servicesJson: JSON.stringify({
          priceSheetSelected: selectedPriceSheetIds,
          serviceLines: details.serviceLines,
          addonFees: details.addonFees.filter((a) => a.enabled)
        }),
        serveJson: JSON.stringify({
          entityBeingServed: details.entityBeingServed,
          serviceAddress: details.serviceAddress,
          city: details.city,
          county: details.county,
          state: details.state,
          zip: details.zip,
          itemsBeingServed: details.itemsBeingServed,
          causeNumber: details.causeNumber,
          courtInfo: details.courtInfo
        }),
        intakeJson: JSON.stringify({ customer, details })
      });
      onClose();
    } catch (err: any) {
      onFlash(err.message || 'Failed to create order', true);
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setCustomer({
      customerId: '',
      name: '',
      address1: '',
      address2: '',
      address3: '',
      city: '',
      state: 'NC',
      zip: '',
      contact: '',
      contactEmail: '',
      phone1: '',
      phone2: '',
      fax: '',
      comment: '',
      alert: '',
      priceSheet: 'Standard',
      linkedUserId: undefined
    });
    setDetails((prev) => ({
      ...prev,
      entityBeingServed: '',
      serviceAddress: '',
      plaintiffName: '',
      defendantName: '',
      causeNumber: '',
      courtInfo: '',
      itemsBeingServed: []
    }));
    onFlash('Form cleared.');
  };

  return (
    <div className="order-modal-backdrop" onClick={onClose}>
      <div
        className="order-modal"
        role="dialog"
        aria-modal="true"
        aria-label="New Order"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Head */}
        <div className="order-modal__head">
          <div>
            <p className="order-modal__eyebrow">Order</p>
            <h2>New Order</h2>
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

        {/* Helpful Tip */}
        <div className="order-tip">{HELPFUL_TIP}</div>

        {/* Copy Existing Order Row */}
        <div className="order-copy-row">
          <label className="order-copy-row__label">Copy Existing Order</label>
          <input
            value={copyOrderId}
            onChange={(e) => setCopyOrderId(e.target.value)}
            placeholder="Order ID #"
            aria-label="Copy existing order ID"
          />
          <button type="button" className="ghost-btn" onClick={handleCopyOrder}>
            Copy Order
          </button>
        </div>

        {/* Order Tabs */}
        <div className="order-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'customer'}
            className={activeTab === 'customer' ? 'active' : ''}
            onClick={() => setActiveTab('customer')}
          >
            Customer
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'details'}
            className={activeTab === 'details' ? 'active' : ''}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="order-intake-form">
          {/* ================= CUSTOMER TAB ================= */}
          {activeTab === 'customer' && (
            <div className="order-tab-pane">
              <div className="order-next-row">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setActiveTab('details')}
                >
                  Next &gt;&gt;
                </button>
              </div>

              {/* Collapsible Customer Header */}
              <button
                type="button"
                className="order-collapse-head"
                onClick={() => setShowCustomerDetails((s) => !s)}
              >
                <span>Customer ({showCustomerDetails ? 'Hide Details...' : 'Show Details...'})</span>
                <span aria-hidden="true">{showCustomerDetails ? '▴▴' : '▾▾'}</span>
              </button>

              {showCustomerDetails && (
                <div className="order-field-grid">
                  <div className="order-field">
                    <span>Customer ID</span>
                    <input value={customer.customerId} readOnly placeholder="—" />
                  </div>

                  <div className="order-field">
                    <span>Customer Name</span>
                    <select
                      value={selectedCustomerKey}
                      onChange={(e) => handleCustomerDropdownChange(e.target.value)}
                    >
                      <option value="">Please Select...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={`user:${c.id}`}>
                          {c.full_name} ({c.agency || 'Client'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="order-field">
                    <span>Customer Name</span>
                    <input
                      value={customer.name}
                      onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                      placeholder="Customer / firm name"
                    />
                  </div>

                  <div className="order-field">
                    <span>Address 1</span>
                    <input
                      value={customer.address1}
                      onChange={(e) => setCustomer((c) => ({ ...c, address1: e.target.value }))}
                      placeholder="Street address"
                    />
                  </div>

                  <div className="order-field">
                    <span>Address 2</span>
                    <input
                      value={customer.address2}
                      onChange={(e) => setCustomer((c) => ({ ...c, address2: e.target.value }))}
                      placeholder="Suite / floor"
                    />
                  </div>

                  <div className="order-field">
                    <span>Address 3</span>
                    <input
                      value={customer.address3}
                      onChange={(e) => setCustomer((c) => ({ ...c, address3: e.target.value }))}
                    />
                  </div>

                  <div className="order-field">
                    <span>City</span>
                    <input
                      value={customer.city}
                      onChange={(e) => setCustomer((c) => ({ ...c, city: e.target.value }))}
                    />
                  </div>

                  <div className="order-field">
                    <span>State</span>
                    <select
                      value={customer.state}
                      onChange={(e) => setCustomer((c) => ({ ...c, state: e.target.value }))}
                    >
                      {US_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="order-field">
                    <span>Zip</span>
                    <input
                      value={customer.zip}
                      onChange={(e) => setCustomer((c) => ({ ...c, zip: e.target.value }))}
                      placeholder="Zip code"
                    />
                  </div>

                  <div className="order-field">
                    <span>Contact</span>
                    <input
                      value={customer.contact}
                      onChange={(e) => setCustomer((c) => ({ ...c, contact: e.target.value }))}
                      placeholder="Contact name"
                    />
                  </div>

                  <div className="order-field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={customer.contactEmail}
                      onChange={(e) => setCustomer((c) => ({ ...c, contactEmail: e.target.value }))}
                      placeholder="contact@firm.com"
                    />
                  </div>

                  <div className="order-field">
                    <span>Phone #1</span>
                    <input
                      value={customer.phone1}
                      onChange={(e) => setCustomer((c) => ({ ...c, phone1: e.target.value }))}
                      placeholder="(___) ___-____"
                    />
                  </div>

                  <div className="order-field">
                    <span>Phone #2</span>
                    <input
                      value={customer.phone2}
                      onChange={(e) => setCustomer((c) => ({ ...c, phone2: e.target.value }))}
                      placeholder="(___) ___-____"
                    />
                  </div>

                  <div className="order-field">
                    <span>Fax</span>
                    <input
                      value={customer.fax}
                      onChange={(e) => setCustomer((c) => ({ ...c, fax: e.target.value }))}
                      placeholder="(___) ___-____"
                    />
                  </div>

                  <div className="order-field order-field--full">
                    <span>Comment</span>
                    <textarea
                      value={customer.comment}
                      onChange={(e) => setCustomer((c) => ({ ...c, comment: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="order-field">
                    <span>
                      Alert{' '}
                      <small className="order-help" title="Shown to staff when opening this customer">
                        help
                      </small>
                    </span>
                    <input
                      value={customer.alert}
                      onChange={(e) => setCustomer((c) => ({ ...c, alert: e.target.value }))}
                    />
                  </div>

                  <div className="order-field">
                    <span>Price Sheet</span>
                    <select
                      value={customer.priceSheet}
                      onChange={(e) => setCustomer((c) => ({ ...c, priceSheet: e.target.value }))}
                    >
                      <option value="Standard">Standard</option>
                      <option value="Premium">Premium</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>

                  <div className="order-field order-field--full">
                    <span>Description</span>
                    <div className="order-desc-box">
                      {PRICE_SHEET_DESCRIPTIONS[customer.priceSheet] || PRICE_SHEET_DESCRIPTIONS.Standard}
                    </div>
                  </div>
                </div>
              )}

              {/* Price Sheet Details Table */}
              <h3 className="order-section-title">Price Sheet Details</h3>
              <div className="price-sheet-wrap">
                <table className="price-sheet-table">
                  <thead>
                    <tr>
                      <th aria-label="Select" />
                      <th>Order Type</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Price</th>
                      <th>Tax Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRICE_SHEET_ITEMS.map((item) => (
                      <tr
                        key={item.id}
                        className={selectedPriceSheetIds.includes(item.id) ? 'selected' : ''}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedPriceSheetIds.includes(item.id)}
                            onChange={() => {
                              setSelectedPriceSheetIds((prev) =>
                                prev.includes(item.id) ? prev.filter((i) => i !== item.id) : [...prev, item.id]
                              );
                            }}
                            aria-label={`Select ${item.name}`}
                          />
                        </td>
                        <td>{item.orderType}</td>
                        <td>{item.name}</td>
                        <td>{item.description}</td>
                        <td className="num">${item.price.toFixed(2)}</td>
                        <td className="num">{item.taxRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="order-customer-actions">
                <button
                  type="button"
                  onClick={() => onFlash('Customer information recorded for this session.')}
                >
                  Save Customer Information
                </button>
                <button
                  type="button"
                  disabled={!customer.name && !selectedCustomerKey}
                  onClick={() => onFlash('Customer marked inactive.')}
                >
                  Deactivate Customer
                </button>
              </div>
            </div>
          )}

          {/* ================= DETAILS TAB ================= */}
          {activeTab === 'details' && (
            <div className="order-tab-pane">
              <h3 className="order-section-title">Order Details</h3>
              <div className="order-details-form">
                <div className="order-field order-field--row">
                  <span>Order Number</span>
                  <strong className="pending-label">Pending</strong>
                </div>

                <div className="order-field order-field--row">
                  <span>Order Status</span>
                  <select
                    value={details.orderStatus}
                    onChange={(e) => setDetails((d) => ({ ...d, orderStatus: e.target.value }))}
                  >
                    <option>Pending</option>
                    <option>Assigned</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>

                <div className="order-field order-field--row">
                  <span>Closed Status</span>
                  <select
                    value={details.closedStatus}
                    onChange={(e) => setDetails((d) => ({ ...d, closedStatus: e.target.value }))}
                  >
                    <option>NA</option>
                    <option>Open</option>
                    <option>Closed</option>
                    <option>On Hold</option>
                  </select>
                </div>

                <div className="order-field order-field--row">
                  <span>Responsible Party</span>
                  <select
                    value={details.responsiblePartyId}
                    onChange={(e) => setDetails((d) => ({ ...d, responsiblePartyId: e.target.value }))}
                  >
                    <option value="">Please Select...</option>
                    {allKnownUsers.map((u) => (
                      <option key={u.id} value={`user:${u.id}`}>
                        {u.full_name} ({u.role === 'client' ? u.agency : u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="order-field order-field--row">
                  <span>Ordered By</span>
                  <select
                    value={details.orderedById}
                    onChange={(e) => setDetails((d) => ({ ...d, orderedById: e.target.value }))}
                  >
                    <option value="">Please Select...</option>
                    {allKnownUsers.map((u) => (
                      <option key={u.id} value={`user:${u.id}`}>
                        {u.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Received Cluster */}
                <div className="order-field order-field--row order-field--datetime">
                  <span>Date Received</span>
                  <div className="datetime-cluster">
                    <input
                      type="date"
                      value={details.dateReceived}
                      onChange={(e) => setDetails((d) => ({ ...d, dateReceived: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={handleSetCurrentDateTime}
                    >
                      Current Date Time
                    </button>
                    <select
                      aria-label="Hour"
                      value={details.dateReceivedHour}
                      onChange={(e) => setDetails((d) => ({ ...d, dateReceivedHour: e.target.value }))}
                    >
                      <option value="">Hr</option>
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Minute"
                      value={details.dateReceivedMin}
                      onChange={(e) => setDetails((d) => ({ ...d, dateReceivedMin: e.target.value }))}
                    >
                      <option value="">Min</option>
                      {['00', '15', '30', '45'].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="AM/PM"
                      value={details.dateReceivedAmPm}
                      onChange={(e) => setDetails((d) => ({ ...d, dateReceivedAmPm: e.target.value }))}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                <div className="order-field order-field--row">
                  <span>Service Speed</span>
                  <select
                    value={details.serviceSpeed}
                    onChange={(e) => setDetails((d) => ({ ...d, serviceSpeed: e.target.value }))}
                  >
                    <option>Standard</option>
                    <option>Rush</option>
                    <option>Same Day</option>
                    <option>Priority</option>
                  </select>
                </div>

                {/* Due Date Cluster */}
                <div className="order-field order-field--row order-field--datetime">
                  <span>Due Date</span>
                  <div className="datetime-cluster">
                    <input
                      type="date"
                      value={details.dueDate}
                      onChange={(e) => setDetails((d) => ({ ...d, dueDate: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={handleSetCurrentDateDue}
                    >
                      Current Date
                    </button>
                  </div>
                </div>

                <div className="order-field order-field--row">
                  <span>Client Matter</span>
                  <input
                    value={details.clientMatter}
                    onChange={(e) => setDetails((d) => ({ ...d, clientMatter: e.target.value }))}
                    placeholder="Matter / Ref #"
                  />
                </div>

                <div className="order-field order-field--row">
                  <span>Plaintiff Name</span>
                  <input
                    value={details.plaintiffName}
                    onChange={(e) => setDetails((d) => ({ ...d, plaintiffName: e.target.value }))}
                    placeholder="Plaintiff"
                  />
                </div>

                <div className="order-field order-field--row">
                  <span>Defendant Name</span>
                  <input
                    value={details.defendantName}
                    onChange={(e) => setDetails((d) => ({ ...d, defendantName: e.target.value }))}
                    placeholder="Defendant"
                  />
                </div>

                <div className="order-field order-field--row">
                  <span>Cause Number</span>
                  <input
                    value={details.causeNumber}
                    onChange={(e) => setDetails((d) => ({ ...d, causeNumber: e.target.value }))}
                    placeholder="Case / Cause number"
                  />
                </div>

                <div className="order-field order-field--row order-field--top">
                  <span>Court Info</span>
                  <textarea
                    rows={3}
                    value={details.courtInfo}
                    onChange={(e) => setDetails((d) => ({ ...d, courtInfo: e.target.value }))}
                    placeholder="Court name, judicial district, county"
                  />
                </div>

                <div className="order-field order-field--row">
                  <span>Entity Being Served</span>
                  <input
                    value={details.entityBeingServed}
                    onChange={(e) => setDetails((d) => ({ ...d, entityBeingServed: e.target.value }))}
                    placeholder="Person or corporate entity to be served"
                  />
                </div>

                <div className="order-field order-field--row">
                  <span>Service Address</span>
                  <input
                    value={details.serviceAddress}
                    onChange={(e) => setDetails((d) => ({ ...d, serviceAddress: e.target.value }))}
                    placeholder="Street address"
                  />
                </div>

                <div className="order-field order-field--row">
                  <span>City</span>
                  <input
                    value={details.city}
                    onChange={(e) => setDetails((d) => ({ ...d, city: e.target.value }))}
                  />
                </div>

                <div className="order-field order-field--row">
                  <span>County</span>
                  <input
                    value={details.county}
                    onChange={(e) => setDetails((d) => ({ ...d, county: e.target.value }))}
                    placeholder="e.g. Onslow County"
                  />
                </div>

                <div className="order-field order-field--row">
                  <span>State</span>
                  <select
                    value={details.state}
                    onChange={(e) => setDetails((d) => ({ ...d, state: e.target.value }))}
                  >
                    {US_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="order-field order-field--row">
                  <span>Zip</span>
                  <input
                    className="input-zip"
                    value={details.zip}
                    onChange={(e) => setDetails((d) => ({ ...d, zip: e.target.value }))}
                    placeholder="Zip code"
                  />
                </div>

                <div className="order-field order-field--row">
                  <span>Process Server</span>
                  <select
                    value={details.processServerId}
                    onChange={(e) => setDetails((d) => ({ ...d, processServerId: e.target.value }))}
                  >
                    <option value="">Unassigned</option>
                    {servers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.agency || 'Process Server'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="order-field order-field--row">
                  <span>Filing Date</span>
                  <input
                    type="date"
                    value={details.filingDate}
                    onChange={(e) => setDetails((d) => ({ ...d, filingDate: e.target.value }))}
                  />
                </div>

                <div className="order-field order-field--row">
                  <span>Filing Fee</span>
                  <input
                    value={details.filingFee}
                    onChange={(e) => setDetails((d) => ({ ...d, filingFee: e.target.value }))}
                    placeholder="$0.00"
                  />
                </div>

                <div className="order-field order-field--row">
                  <span>Estimated Amount</span>
                  <input
                    value={details.estimatedAmount}
                    onChange={(e) => setDetails((d) => ({ ...d, estimatedAmount: e.target.value }))}
                    placeholder="$75.00"
                  />
                </div>

                <div className="order-field order-field--row">
                  <span>Manner of Service</span>
                  <input
                    value={details.mannerOfService}
                    onChange={(e) => setDetails((d) => ({ ...d, mannerOfService: e.target.value }))}
                    placeholder="Personal / Substituted / Corporate Agent"
                  />
                </div>

                {/* Items Being Served Grid (23 items in 3 columns) */}
                <div className="order-field order-field--row order-field--top">
                  <span>Items Being Served</span>
                  <div className="items-served-grid">
                    {ITEMS_TO_SERVE.map((item) => (
                      <label key={item} className="items-served-item">
                        <input
                          type="checkbox"
                          checked={details.itemsBeingServed.includes(item)}
                          onChange={() => toggleItemBeingServed(item)}
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="order-field order-field--row">
                  <span>Other Items</span>
                  <input
                    value={details.otherItems}
                    onChange={(e) => setDetails((d) => ({ ...d, otherItems: e.target.value }))}
                    placeholder="Any additional legal documents"
                  />
                </div>

                <div className="order-field order-field--row order-field--top">
                  <span>Office Notes</span>
                  <textarea
                    rows={2}
                    value={details.officeNotes}
                    onChange={(e) => setDetails((d) => ({ ...d, officeNotes: e.target.value }))}
                  />
                </div>

                <div className="order-field order-field--row order-field--top">
                  <span>Service Instructions</span>
                  <textarea
                    rows={3}
                    value={details.serviceInstructions}
                    onChange={(e) => setDetails((d) => ({ ...d, serviceInstructions: e.target.value }))}
                    placeholder="Hours target is home, vehicle details, gate codes, warnings"
                  />
                </div>
              </div>

              {/* Subpoena Cluster */}
              <div className="services-block">
                <div className="services-block__head">
                  <h4>Subpoena Details (If Applicable)</h4>
                </div>
                <div className="order-field-grid">
                  <div className="order-field">
                    <span>Subpoena County</span>
                    <input
                      value={details.subpoenaCounty}
                      onChange={(e) => setDetails((d) => ({ ...d, subpoenaCounty: e.target.value }))}
                    />
                  </div>
                  <div className="order-field">
                    <span>Location Name</span>
                    <input
                      value={details.subpoenaLocationName}
                      onChange={(e) => setDetails((d) => ({ ...d, subpoenaLocationName: e.target.value }))}
                    />
                  </div>
                  <div className="order-field order-field--full">
                    <span>Location Address</span>
                    <input
                      value={details.subpoenaLocationAddress}
                      onChange={(e) => setDetails((d) => ({ ...d, subpoenaLocationAddress: e.target.value }))}
                    />
                  </div>
                  <div className="order-field">
                    <span>Date &amp; Time</span>
                    <input
                      type="date"
                      value={details.subpoenaDate}
                      onChange={(e) => setDetails((d) => ({ ...d, subpoenaDate: e.target.value }))}
                    />
                  </div>
                  <div className="order-field">
                    <span>Requestor</span>
                    <select
                      value={details.subpoenaRequestor}
                      onChange={(e) => setDetails((d) => ({ ...d, subpoenaRequestor: e.target.value }))}
                    >
                      <option value="PLAINTIFF">PLAINTIFF</option>
                      <option value="DEFENDANT">DEFENDANT</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Services Block */}
              <div className="services-block">
                <div className="services-block__head">
                  <h4>Service Lines</h4>
                  <button type="button" className="ghost-btn" onClick={addCustomServiceLine}>
                    + Add Line
                  </button>
                </div>
                <table className="services-line-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Qty</th>
                      <th>Service Name</th>
                      <th style={{ width: 100 }}>Price</th>
                      <th>Comment</th>
                      <th style={{ width: 50 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {details.serviceLines.map((line) => (
                      <tr key={line.id}>
                        <td>
                          <input
                            type="number"
                            className="qty-input"
                            value={line.qty}
                            onChange={(e) => updateServiceLine(line.id, { qty: Number(e.target.value) || 1 })}
                          />
                        </td>
                        <td>
                          <input
                            className="service-name"
                            value={line.name}
                            onChange={(e) => updateServiceLine(line.id, { name: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="price-input"
                            value={line.price}
                            onChange={(e) => updateServiceLine(line.id, { price: Number(e.target.value) || 0 })}
                          />
                        </td>
                        <td>
                          <input
                            value={line.comment}
                            onChange={(e) => updateServiceLine(line.id, { comment: e.target.value })}
                            placeholder="Optional comment"
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="icon-close"
                            onClick={() => removeServiceLine(line.id)}
                            title="Remove"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Addon Fees */}
                <div className="addon-fees">
                  {details.addonFees.map((fee) => (
                    <div key={fee.id} className="addon-fee-row">
                      <input
                        type="checkbox"
                        checked={fee.enabled}
                        onChange={(e) => updateAddonFee(fee.id, { enabled: e.target.checked })}
                      />
                      <span className="addon-fee-name">{fee.name}</span>
                      <input
                        value={fee.comment}
                        onChange={(e) => updateAddonFee(fee.id, { comment: e.target.value })}
                        placeholder="Add-on notes"
                      />
                      <span className="addon-fee-price">${fee.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="order-modal__footer">
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Creating Order…' : 'Create Order'}
            </button>
            <button type="button" onClick={handleClearForm}>
              Clear Form
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
