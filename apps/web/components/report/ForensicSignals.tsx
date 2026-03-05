import type { SignalRow } from "./utils";

interface Props {
  rows: SignalRow[];
}

export function ForensicSignals({ rows }: Props) {
  return (
    <section className="mb-8">
      <p className="text-[10px] font-mono text-[#a8a29e] uppercase tracking-widest mb-3">Forensic Signals</p>
      <div className="border border-[#e8e4de] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e8e4de] bg-[#fafaf8]">
              <th className="text-left px-4 py-2.5 text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider">
                Signal
              </th>
              <th className="text-left px-4 py-2.5 text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider">
                Status
              </th>
              <th className="text-center px-4 py-2.5 text-[10px] font-mono text-[#9ca3af] uppercase tracking-wider w-16">
                Flag
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ede8]">
            {rows.map((row) => (
              <tr key={row.label} className="hover:bg-[#fafaf8] transition-colors">
                <td className="px-4 py-3">
                  <p className="text-[13px] font-medium text-[#0a0a0a]">{row.label}</p>
                  <p className="text-[10.5px] text-[#9ca3af] mt-0.5 font-mono">{row.note}</p>
                </td>
                <td className="px-4 py-3 text-[12.5px] text-[#374151]">{row.value}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      row.flagged ? "bg-red-500" : "bg-green-400"
                    }`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
