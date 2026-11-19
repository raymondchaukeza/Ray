import React, { useState } from 'react';
import {
  Newspaper,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  MapPin,
  Clock,
} from 'lucide-react';
import { NewsBulletin, NewsCategory } from '../types/index.ts';
import { filterNewsBulletins } from '../utils/siteMenuRules.ts';

interface PublicNewsViewProps {
  bulletins: NewsBulletin[];
  onGoToFaultTicket: () => void;
}

const CATEGORIES: NewsCategory[] = [
  'All',
  'Network Status',
  'Maintenance',
  'Hotspot Rollout',
  'Promotions',
];

export const PublicNewsView: React.FC<PublicNewsViewProps> = ({
  bulletins,
  onGoToFaultTicket,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string>(bulletins[0]?.id || '');

  const visibleBulletins = filterNewsBulletins(bulletins, selectedCategory, searchQuery);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className="border rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ backgroundColor: '#000000', borderColor: '#232323' }}
      >
        <div>
          <span className="text-[11px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
            NOC Public Bulletins &amp; Network Advisories
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 mt-1.5">
            <Newspaper className="w-6 h-6 text-cyan-400" />
            <span>PUBLIC NEWS &amp; NETWORK UPDATES</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Live optical splice maintenance notices, VXK hotspot rollouts, tariff updates, and
            regional infrastructure advisories.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToFaultTicket}
          style={{ backgroundColor: '#ff0000', color: '#ffffff' }}
          className="px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:brightness-110 transition shrink-0"
        >
          Report Area Outage
        </button>
      </div>

      {/* Filters & Search */}
      <div
        className="border rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
        style={{ backgroundColor: '#000000', borderColor: '#232323' }}
      >
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  active
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="relative md:w-72 text-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search area or bulletin..."
            style={{ backgroundColor: '#060606' }}
            className="w-full pl-9 pr-3 py-2 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Bulletins List */}
      <div className="space-y-4">
        {visibleBulletins.length === 0 ? (
          <div
            className="border rounded-2xl p-8 text-center text-xs text-slate-400"
            style={{ backgroundColor: '#000000', borderColor: '#232323' }}
          >
            No public news bulletins match your filter.
          </div>
        ) : (
          visibleBulletins.map((item) => {
            const isExpanded = expandedId === item.id;
            const SeverityIcon =
              item.severity === 'success'
                ? CheckCircle2
                : item.severity === 'warning'
                ? AlertTriangle
                : Info;
            const severityColor =
              item.severity === 'success'
                ? 'text-emerald-400'
                : item.severity === 'warning'
                ? 'text-amber-400'
                : 'text-cyan-400';

            return (
              <article
                key={item.id}
                style={{ backgroundColor: '#000000', borderColor: '#232323' }}
                className="border rounded-2xl p-6 shadow-xl space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityIcon className={`w-4 h-4 ${severityColor}`} />
                    <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {item.category}
                    </span>
                    <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.publishedAt}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">By {item.author}</span>
                </div>

                <h3 className="text-lg font-black text-white">{item.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{item.summary}</p>

                {isExpanded && (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                    {item.details}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Zones:</span>
                    {item.affectedAreas.map((area) => (
                      <span
                        key={area}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                      >
                        {area}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? '' : item.id)}
                    className="text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    {isExpanded ? 'Hide Details ▲' : 'Read Full Notice ▼'}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
