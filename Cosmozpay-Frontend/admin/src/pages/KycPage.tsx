import { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import {
  fetchAdminKyc,
  reviewAdminUserKyc,
  type AdminGlobalKycRecord,
  type AdminPage,
} from '../services/adminUsers';

const PAGE_SIZE = 20;
const STATUS_OPTIONS = ['pending', 'reviewing', 'approved', 'rejected', 'expired'];
const DOCUMENT_OPTIONS = ['bvn', 'nin', 'passport', 'drivers_license', 'international_passport'];

function displayName(record: AdminGlobalKycRecord): string {
  return [record.user_first_name, record.user_last_name].filter(Boolean).join(' ') || 'Name not available';
}

function formatDate(value: string | null): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
}

function label(value: string | null): string {
  return value ? value.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Not available';
}

function KycPage() {
  const [records, setRecords] = useState<AdminPage<AdminGlobalKycRecord> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [selected, setSelected] = useState<AdminGlobalKycRecord | null>(null);
  const [reviewTarget, setReviewTarget] = useState<AdminGlobalKycRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchAdminKyc({
      page,
      page_size: PAGE_SIZE,
      search: searchQuery || undefined,
      status: status || undefined,
      document_type: documentType || undefined,
    }).then((result) => {
      if (active) setRecords(result);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Unable to load KYC submissions.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [page, searchQuery, status, documentType, reload]);

  const submitReview = async (record: AdminGlobalKycRecord, action: 'approved' | 'rejected', notes = '') => {
    if (reviewing) return;
    if (action === 'rejected' && !notes.trim()) {
      setError('A rejection reason is required.');
      return;
    }

    setReviewing(true);
    setError(null);
    try {
      await reviewAdminUserKyc(record.user_id, record.id, action, notes);
      setSelected(null);
      setReviewTarget(null);
      setReviewNotes('');
      setToast(`KYC ${action} successfully.`);
      setReload((current) => current + 1);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit the KYC review.');
    } finally {
      setReviewing(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setDocumentType('');
    setPage(1);
  };

  return (
    <div className="kyc-page">
      <header className="kyc-heading">
        <div>
          <h1 className="page-heading">KYC submissions</h1>
          <p>Review customer submissions and the profile details relevant to virtual-account requests.</p>
        </div>
        <button type="button" onClick={() => setReload((current) => current + 1)} disabled={loading}>
          Refresh
        </button>
      </header>

      <section className="panel">
        <div className="kyc-toolbar">
          <label>
            <span>Search customers and submissions</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, phone or submission ID"
            />
          </label>
          <label>
            <span>KYC status</span>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{label(option)}</option>)}
            </select>
          </label>
          <label>
            <span>Document type</span>
            <select value={documentType} onChange={(event) => { setDocumentType(event.target.value); setPage(1); }}>
              <option value="">All document types</option>
              {DOCUMENT_OPTIONS.map((option) => <option key={option} value={option}>{label(option)}</option>)}
            </select>
          </label>
          <button type="button" className="kyc-clear-filters" onClick={clearFilters} disabled={!search && !status && !documentType}>
            Clear filters
          </button>
        </div>

        {error && (
          <div className="kyc-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setReload((current) => current + 1)}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="kyc-state" aria-live="polite">Loading KYC submissions…</div>
        ) : !error && records?.items.length === 0 ? (
          <div className="kyc-state">
            <strong>No KYC submissions found</strong>
            <span>Try changing or clearing the search and filters.</span>
          </div>
        ) : !error && records && (
          <>
            <div className="kyc-table-scroll">
              <table className="table kyc-table">
                <thead>
                  <tr>
                    <th>Customer profile</th>
                    <th>Submission</th>
                    <th>Document</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Review</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {records.items.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <strong>{displayName(record)}</strong>
                        <span>{record.user_email}</span>
                        <span>{record.user_phone || 'Phone not available'}</span>
                      </td>
                      <td><code>{record.id}</code></td>
                      <td>{label(record.document_type)}</td>
                      <td><span className={`kyc-status kyc-status-${record.verification_status.toLowerCase()}`}>{label(record.verification_status)}</span></td>
                      <td>{formatDate(record.submitted_at)}</td>
                      <td>
                        <span>{record.reviewed_by ? `By ${record.reviewed_by}` : 'Not reviewed'}</span>
                        {record.reviewed_at && <small>{formatDate(record.reviewed_at)}</small>}
                      </td>
                      <td>
                        <button type="button" className="kyc-view-button" onClick={() => setSelected(record)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="kyc-pagination">
              <span>Page {records.page} of {Math.max(records.total_pages, 1)} · {records.total} submissions</span>
              <div>
                <button type="button" disabled={loading || records.page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
                <button type="button" disabled={loading || records.page >= records.total_pages} onClick={() => setPage((current) => current + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </section>

      <Modal open={selected !== null} title="KYC submission details" onClose={() => setSelected(null)} closeDisabled={reviewing}>
        {selected && (
          <div className="kyc-detail">
            <section>
              <h4>Customer profile <small>Not verified by this KYC submission</small></h4>
              <p><strong>Name:</strong> {displayName(selected)}</p>
              <p><strong>Email:</strong> {selected.user_email}</p>
              <p><strong>Phone:</strong> {selected.user_phone || 'Not available'}</p>
            </section>
            <section>
              <h4>Submission record</h4>
              <p><strong>KYC ID:</strong> <code>{selected.id}</code></p>
              <p><strong>Status:</strong> <span className={`kyc-status kyc-status-${selected.verification_status.toLowerCase()}`}>{label(selected.verification_status)}</span></p>
              <p><strong>Verification level:</strong> {label(selected.verification_level)}</p>
              <p><strong>Document type:</strong> {label(selected.document_type)}</p>
              <p><strong>Document verification:</strong> {label(selected.document_verification_status)}</p>
              <p><strong>Submitted:</strong> {formatDate(selected.submitted_at)}</p>
              <p><strong>Reviewed:</strong> {formatDate(selected.reviewed_at)}</p>
              <p><strong>Reviewer:</strong> {selected.reviewed_by || 'Not available'}</p>
              <p><strong>Verified:</strong> {selected.is_verified ? 'Yes' : 'No'}</p>
              {selected.rejection_reason && <p><strong>Rejection reason:</strong> {selected.rejection_reason}</p>}
            </section>
            {['pending', 'reviewing'].includes(selected.verification_status.toLowerCase()) && (
              <div className="kyc-detail-actions">
                <button type="button" disabled={reviewing} onClick={() => void submitReview(selected, 'approved')}>Approve</button>
                <button type="button" className="kyc-reject-button" disabled={reviewing} onClick={() => { setReviewTarget(selected); setReviewNotes(''); }}>
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={reviewTarget !== null}
        title="Reject KYC submission"
        onClose={() => { if (!reviewing) { setReviewTarget(null); setReviewNotes(''); } }}
        closeDisabled={reviewing}
      >
        {reviewTarget && (
          <div className="kyc-review-form">
            <p>Provide a reason for rejecting submission <code>{reviewTarget.id}</code>.</p>
            <label>
              Rejection reason
              <textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} rows={4} maxLength={2000} />
            </label>
            <button type="button" disabled={reviewing || !reviewNotes.trim()} onClick={() => void submitReview(reviewTarget, 'rejected', reviewNotes)}>
              {reviewing ? 'Submitting…' : 'Confirm rejection'}
            </button>
          </div>
        )}
      </Modal>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default KycPage;
