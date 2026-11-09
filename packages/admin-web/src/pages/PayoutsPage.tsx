import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Landmark, ArrowUpRight, Download, CheckCircle2, Clock, Plus, Building2 } from 'lucide-react';

export const PayoutsPage: React.FC = () => {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [bankTxRef, setBankTxRef] = useState('');
  const [payingItemId, setPayingItemId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadPayouts();
  }, []);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const res = await api.getPayouts();
      setBatches(res.data || []);
      if (res.data?.length > 0 && !selectedBatch) {
        setSelectedBatch(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBatch = async () => {
    try {
      setGenerating(true);
      const res = await api.generatePayoutBatch();
      setSuccessMsg(`T+1 settlement batch ${res.data.batchRef} generated for ₹${res.data.totalAmount.toLocaleString()}!`);
      await loadPayouts();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Batch generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (itemId: string) => {
    if (!bankTxRef.trim()) {
      alert('Please enter bank transaction reference / UTR number');
      return;
    }
    try {
      setPayingItemId(itemId);
      await api.markPayoutPaid(itemId, bankTxRef);
      setSuccessMsg(`Payout item successfully marked as paid with UTR ${bankTxRef}`);
      setBankTxRef('');
      await loadPayouts();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Mark paid failed: ${err.message}`);
    } finally {
      setPayingItemId(null);
    }
  };

  const exportCsv = () => {
    if (!selectedBatch?.items) return;
    const headers = 'Provider ID,Provider Name,Net Amount,Bank Account,Status,Bank UTR\n';
    const rows = selectedBatch.items
      .map(
        (i: any) =>
          `"${i.providerId}","${i.provider?.businessName || i.provider?.user?.fullName}",${i.netAmount},"${i.bankAccountRef}","${i.status}","${i.bankTxRef || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedBatch.batchRef}_bank_export.csv`;
    a.click();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-5 h-5 text-brand-600" />
            <span>Next-Day (T+1) Provider Settlements Desk</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated net provider payout batches for completed appointments. Bank export & UTR reconciliation.
          </p>
        </div>

        <button
          onClick={handleGenerateBatch}
          disabled={generating}
          className="px-4 py-2.5 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{generating ? 'Generating...' : 'Generate Today’s T+1 Batch'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Batches Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {batches.map((b) => (
          <div
            key={b.id}
            onClick={() => setSelectedBatch(b)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              selectedBatch?.id === b.id
                ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700">
              <span>{b.batchRef}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px]">{b.status}</span>
            </div>
            <div className="mt-2 text-2xl font-bold font-display text-slate-900">
              ₹{b.totalAmount.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {b.providerCount} providers • Settlement Date: {b.settlementDate}
            </p>
          </div>
        ))}
      </div>

      {/* Selected Batch Detail Table */}
      {selectedBatch && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Batch Ledger: {selectedBatch.batchRef}
              </h3>
              <p className="text-xs text-slate-400">Total Net Amount: ₹{selectedBatch.totalAmount.toLocaleString()}</p>
            </div>
            <button
              onClick={exportCsv}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Bank CSV</span>
            </button>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3.5">Provider Specialist</th>
                <th className="px-6 py-3.5">Bank Account / IFSC</th>
                <th className="px-6 py-3.5">Net Payout</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Bank UTR Reconciliation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(!selectedBatch.items || selectedBatch.items.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No items in this batch.
                  </td>
                </tr>
              ) : (
                selectedBatch.items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div>{item.provider?.businessName || item.provider?.user?.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.provider?.user?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {item.bankAccountRef || 'Bank Account on file'}
                    </td>
                    <td className="px-6 py-4 font-bold font-display text-brand-700 text-sm">
                      ₹{item.netAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status === 'PAID' ? (
                        <span className="font-mono text-xs font-bold text-slate-700">
                          UTR: {item.bankTxRef}
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Enter Bank UTR..."
                            value={bankTxRef}
                            onChange={(e) => setBankTxRef(e.target.value)}
                            className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-brand-500 w-36"
                          />
                          <button
                            onClick={() => handleMarkPaid(item.id)}
                            disabled={payingItemId === item.id}
                            className="px-3 py-1 rounded-lg bg-charcoal-900 hover:bg-black text-white text-xs font-semibold"
                          >
                            Mark Paid
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

