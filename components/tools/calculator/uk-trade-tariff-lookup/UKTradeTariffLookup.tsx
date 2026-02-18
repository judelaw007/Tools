/**
 * UK Trade Tariff Lookup — React Component
 *
 * Simulates the HMRC Online Trade Tariff (trade-tariff.service.gov.uk)
 * with a curated dataset of commodity codes relevant to H&C's product lines.
 *
 * Three search modes: text search, hierarchy browse, direct code entry.
 * Full duty picture with preferential rates, trade remedies, VAT, and import controls.
 * Optional compare mode for side-by-side country comparison.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import type {
  SearchMode,
  HierarchyLevel,
  UKTradeTariffLookupProps,
  TariffLookupCallbacks,
  TariffLookupConfig,
  TariffLookupResult,
  TariffAlert,
  SearchResult,
  CountryComparison,
  CommodityRecord,
  Country,
  DutyRate,
  TradeRemedy,
  ImportControl,
  HCTariffScenario,
} from './types';
import {
  TARIFF_SECTIONS,
  COUNTRIES,
  COMMODITY_RECORDS,
  searchCommodities,
  getCommodityByCode,
  getCommoditiesByChapter,
  getCommoditiesByHeading,
  getCountryByCode,
  getSectionByChapter,
  performLookup,
  compareCountries,
  HC_TARIFF_SCENARIOS,
  getScenarioById,
} from './utils';

// ─── Sub-Components ─────────────────────────────────────────────────────────────

/** Search mode tab selector */
function ModeSelector({
  mode,
  onModeChange,
}: {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}) {
  const modes: { value: SearchMode; label: string; description: string }[] = [
    { value: 'text', label: 'Search', description: 'Search by keyword' },
    { value: 'browse', label: 'Browse', description: 'Browse by Section/Chapter' },
    { value: 'direct', label: 'Direct Entry', description: 'Enter a known code' },
  ];

  return (
    <div className="flex border-b border-gray-200 mb-4" role="tablist">
      {modes.map((m) => (
        <button
          key={m.value}
          role="tab"
          aria-selected={mode === m.value}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            mode === m.value
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => onModeChange(m.value)}
          title={m.description}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

/** Text search input and results */
function TextSearch({
  onSelect,
  showTooltips,
}: {
  onSelect: (code: string) => void;
  showTooltips: boolean;
}) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchCommodities(query), [query]);

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="tariff-search" className="block text-sm font-medium text-gray-700 mb-1">
          Search for a product
        </label>
        <input
          id="tariff-search"
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g. olive oil, ceramic cups, tea, preserves..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {showTooltips && (
          <p className="mt-1 text-xs text-gray-500">
            Search across commodity descriptions, keywords, and codes. Select a result to see the full duty picture.
          </p>
        )}
      </div>

      {results.length > 0 && (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chapter</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Declarable</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((r) => (
                <tr
                  key={r.code}
                  className="cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => onSelect(r.code)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSelect(r.code); }}
                >
                  <td className="px-4 py-2 text-sm font-mono text-blue-600">{formatCode(r.code)}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{r.description}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{r.hierarchy.chapter.title}</td>
                  <td className="px-4 py-2 text-center">
                    {r.declarable ? (
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">Yes</span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {query.length > 2 && results.length === 0 && (
        <p className="text-sm text-gray-500 italic">No matching commodity codes found. Try a different keyword or browse by Section/Chapter.</p>
      )}
    </div>
  );
}

/** Hierarchy browse (Section → Chapter → Heading → Code) */
function HierarchyBrowse({
  onSelect,
  showTooltips,
}: {
  onSelect: (code: string) => void;
  showTooltips: boolean;
}) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const sectionCommodities = useMemo(() => {
    if (!selectedChapter) return [];
    return getCommoditiesByChapter(selectedChapter);
  }, [selectedChapter]);

  const chaptersWithData = useMemo(() => {
    if (!selectedSection) return [];
    const section = TARIFF_SECTIONS.find((s) => s.number === selectedSection);
    if (!section) return [];
    return section.chapters.filter((ch) => getCommoditiesByChapter(ch).length > 0);
  }, [selectedSection]);

  return (
    <div>
      {showTooltips && (
        <p className="text-xs text-gray-500 mb-3">
          Browse the tariff hierarchy: select a Section, then a Chapter, then a commodity code.
        </p>
      )}

      {/* Section selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          value={selectedSection ?? ''}
          onChange={(e) => {
            setSelectedSection(e.target.value || null);
            setSelectedChapter(null);
          }}
        >
          <option value="">Select a Section (I–XXI)...</option>
          {TARIFF_SECTIONS.map((s) => (
            <option key={s.number} value={s.number}>
              {s.number} — {s.title} (Ch {s.chapterRange})
            </option>
          ))}
        </select>
      </div>

      {/* Chapter selector (only show chapters with data) */}
      {selectedSection && chaptersWithData.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={selectedChapter ?? ''}
            onChange={(e) => setSelectedChapter(e.target.value || null)}
          >
            <option value="">Select a Chapter...</option>
            {chaptersWithData.map((ch) => {
              const commodities = getCommoditiesByChapter(ch);
              const chapterTitle = commodities[0]?.hierarchy.chapter.title ?? '';
              return (
                <option key={ch} value={ch}>
                  Chapter {ch} — {chapterTitle} ({commodities.length} codes)
                </option>
              );
            })}
          </select>
        </div>
      )}

      {selectedSection && chaptersWithData.length === 0 && (
        <p className="text-sm text-gray-500 italic mb-4">
          No commodity codes in this section for the H&C curated dataset. Try Section II (tea), III (olive oil), IV (preserves, wine), or XIII (ceramics).
        </p>
      )}

      {/* Commodity list */}
      {sectionCommodities.length > 0 && (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MFN Duty</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sectionCommodities.map((c) => (
                <tr
                  key={c.code}
                  className="cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => onSelect(c.code)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSelect(c.code); }}
                >
                  <td className="px-4 py-2 text-sm font-mono text-blue-600">{formatCode(c.code)}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{c.shortDescription}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{c.thirdCountryDuty.displayRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Direct code entry */
function DirectEntry({
  onSelect,
  preSelectedCode,
  showTooltips,
}: {
  onSelect: (code: string) => void;
  preSelectedCode?: string;
  showTooltips: boolean;
}) {
  const [code, setCode] = useState(preSelectedCode ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const cleaned = code.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setError('Please enter a 10-digit commodity code (e.g., 1509200090).');
      return;
    }
    const commodity = getCommodityByCode(cleaned);
    if (!commodity) {
      setError(`Code ${formatCode(cleaned)} is not in the curated dataset. Try searching by keyword instead.`);
      return;
    }
    setError(null);
    onSelect(cleaned);
  };

  return (
    <div>
      <label htmlFor="direct-code" className="block text-sm font-medium text-gray-700 mb-1">
        Enter commodity code
      </label>
      <div className="flex gap-2">
        <input
          id="direct-code"
          type="text"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
          placeholder="e.g. 1509200090"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          maxLength={10}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          onClick={handleSubmit}
        >
          Look up
        </button>
      </div>
      {showTooltips && (
        <p className="mt-1 text-xs text-gray-500">
          Enter the full 10-digit commodity code. For import declarations, only 10-digit codes are declarable.
        </p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

/** Country selector dropdown */
function CountrySelector({
  selectedCountry,
  onSelect,
  showTooltips,
}: {
  selectedCountry: string | null;
  onSelect: (countryCode: string) => void;
  showTooltips: boolean;
}) {
  return (
    <div className="mb-4">
      <label htmlFor="country-select" className="block text-sm font-medium text-gray-700 mb-1">
        Country of origin
      </label>
      <select
        id="country-select"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        value={selectedCountry ?? ''}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">Select country of origin...</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name} — {c.schemeName}
          </option>
        ))}
      </select>
      {showTooltips && (
        <p className="mt-1 text-xs text-gray-500">
          The country of origin determines the applicable duty rate. Countries with FTAs or preference schemes may attract lower or zero duty.
        </p>
      )}
    </div>
  );
}

/** Hierarchy breadcrumb display */
function BreadcrumbDisplay({ commodity }: { commodity: CommodityRecord }) {
  const h = commodity.hierarchy;
  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-3" aria-label="Tariff hierarchy">
      <span className="font-medium">Section {h.section.number}</span>
      <span>›</span>
      <span>Ch {h.chapter.code}</span>
      <span>›</span>
      <span>Heading {h.heading.code}</span>
      {h.subheading && (
        <>
          <span>›</span>
          <span>Subheading {h.subheading.code}</span>
        </>
      )}
      {h.commodityCode && (
        <>
          <span>›</span>
          <span className="font-mono font-medium text-blue-600">{formatCode(h.commodityCode.code)}</span>
        </>
      )}
    </nav>
  );
}

/** Duty rate display card */
function DutyRateCard({
  title,
  duty,
  variant,
  showTooltips,
  tooltipText,
}: {
  title: string;
  duty: DutyRate;
  variant: 'mfn' | 'preferential' | 'remedy';
  showTooltips: boolean;
  tooltipText?: string;
}) {
  const bgColor = {
    mfn: 'bg-amber-50 border-amber-200',
    preferential: 'bg-green-50 border-green-200',
    remedy: 'bg-red-50 border-red-200',
  }[variant];

  const labelColor = {
    mfn: 'text-amber-800',
    preferential: 'text-green-800',
    remedy: 'text-red-800',
  }[variant];

  return (
    <div className={`border rounded-md p-3 ${bgColor}`}>
      <div className={`text-xs font-medium uppercase ${labelColor} mb-1`}>{title}</div>
      <div className="text-lg font-bold text-gray-900">{duty.displayRate}</div>
      {duty.preferenceScheme && duty.preferenceScheme !== 'mfn' && (
        <div className="text-xs text-gray-600 mt-1">
          Scheme: {duty.preferenceScheme.replace(/-/g, ' ').toUpperCase()} | Code: {duty.preferenceCode}
        </div>
      )}
      {duty.proofOfOrigin && (
        <div className="text-xs text-gray-500 mt-1">
          Proof: {duty.proofOfOrigin}
        </div>
      )}
      {showTooltips && tooltipText && (
        <div className="text-xs text-gray-500 mt-2 italic">{tooltipText}</div>
      )}
    </div>
  );
}

/** Trade remedy alert panel */
function TradeRemedyPanel({ remedy }: { remedy: TradeRemedy }) {
  return (
    <div className="border border-red-200 rounded-md p-3 bg-red-50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-600 font-bold text-sm">⚠ Trade Remedy</span>
        <span className="text-xs text-red-700 font-medium uppercase">{remedy.type.replace('-', ' ')}</span>
      </div>
      <div className="text-sm text-gray-900 mb-1">
        <strong>Rate:</strong> {remedy.displayRate} (on top of MFN duty)
      </div>
      <div className="text-xs text-gray-600">
        <div><strong>Legal basis:</strong> {remedy.legalBasis}</div>
        <div><strong>Expires:</strong> {remedy.expiryDate}</div>
        <div><strong>Applies to:</strong> {remedy.applicability}</div>
      </div>
      {remedy.exporterRates.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-red-700 cursor-pointer">Exporter-specific rates</summary>
          <table className="mt-1 text-xs w-full">
            <tbody>
              {remedy.exporterRates.map((er, i) => (
                <tr key={i}>
                  <td className="pr-2 text-gray-600">{er.category}</td>
                  <td className="font-mono text-gray-900">{er.displayRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}

/** Alert display */
function AlertDisplay({ alert }: { alert: TariffAlert }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }[alert.severity];

  const icon = { error: '✕', warning: '!', info: 'i' }[alert.severity];

  return (
    <div className={`border rounded-md p-3 ${styles}`}>
      <div className="flex items-start gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-current bg-opacity-20 text-xs font-bold flex-shrink-0 mt-0.5">
          {icon}
        </span>
        <div>
          <div className="text-sm font-medium">[{alert.ruleId}] {alert.message}</div>
          <div className="text-xs mt-1 opacity-80">{alert.educationalNote}</div>
        </div>
      </div>
    </div>
  );
}

/** Full lookup result display */
function ResultDisplay({
  result,
  showTooltips,
}: {
  result: TariffLookupResult;
  showTooltips: boolean;
}) {
  const { commodity, country, applicableDuty, applicableRemedies, effectiveDutyDisplay, vatPercent } = result;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <BreadcrumbDisplay commodity={commodity} />
        <h3 className="text-lg font-bold text-gray-900">{commodity.description}</h3>
        <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
          <span className="font-mono font-medium text-blue-600">{formatCode(commodity.code)}</span>
          <span>|</span>
          <span>Origin: <strong>{country.name}</strong></span>
          <span>|</span>
          <span className={`font-medium ${commodity.declarable ? 'text-green-600' : 'text-yellow-600'}`}>
            {commodity.declarable ? 'Declarable' : 'Not declarable'}
          </span>
        </div>
      </div>

      {/* Duty rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DutyRateCard
          title="Third Country (MFN) Duty"
          duty={commodity.thirdCountryDuty}
          variant="mfn"
          showTooltips={showTooltips}
          tooltipText="The default duty rate for countries with no FTA. This is the baseline rate."
        />
        {applicableDuty.preferenceScheme && applicableDuty.preferenceScheme !== 'mfn' ? (
          <DutyRateCard
            title={`Preferential Rate (${country.schemeName})`}
            duty={applicableDuty}
            variant="preferential"
            showTooltips={showTooltips}
            tooltipText="The reduced rate under an FTA or preference scheme. Proof of origin is required to claim this rate."
          />
        ) : (
          <div className="border rounded-md p-3 bg-gray-50 border-gray-200">
            <div className="text-xs font-medium uppercase text-gray-500 mb-1">Preferential Rate</div>
            <div className="text-sm text-gray-500 italic">No preferential rate available for {country.name}</div>
          </div>
        )}
      </div>

      {/* Trade remedies */}
      {applicableRemedies.length > 0 && (
        <div>
          {applicableRemedies.map((r, i) => (
            <TradeRemedyPanel key={i} remedy={r} />
          ))}
        </div>
      )}

      {/* Effective duty summary */}
      <div className="bg-gray-900 text-white rounded-lg p-4">
        <div className="text-xs uppercase text-gray-400 mb-1">Effective Total Duty</div>
        <div className="text-2xl font-bold">{effectiveDutyDisplay}</div>
        <div className="text-sm text-gray-300 mt-1">
          Import VAT: {vatPercent}% ({commodity.vatOnImportation === 'zero-rated' ? 'zero-rated food' : 'standard rate'})
        </div>
      </div>

      {/* Additional information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Import controls */}
        <div className="border border-gray-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Import Controls</h4>
          {commodity.importControls.length > 0 ? (
            <ul className="space-y-1">
              {commodity.importControls.map((control, i) => (
                <li key={i} className="text-xs text-gray-600">
                  <span className="font-medium">{control.name}</span>
                  {control.documentCode && <span className="text-gray-400"> ({control.documentCode})</span>}
                  <span className="block text-gray-500">{control.condition}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 italic">No specific import controls for this commodity.</p>
          )}
        </div>

        {/* Supplementary units & VAT */}
        <div className="border border-gray-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Details</h4>
          <dl className="space-y-1 text-xs">
            <div>
              <dt className="font-medium text-gray-600 inline">Supplementary units: </dt>
              <dd className="inline text-gray-500">{commodity.supplementaryUnits ?? 'None required'}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600 inline">VAT reference: </dt>
              <dd className="inline text-gray-500">{commodity.vatReference}</dd>
            </div>
            {commodity.vatOnImportation === 'zero-rated' && (
              <div className="text-green-700 font-medium">
                Declare additional code VATZ on CDS to claim zero-rating.
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Rules of origin */}
      <div className="border border-gray-200 rounded-md p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Rules of Origin</h4>
        <p className="text-xs text-gray-600">{result.rulesOfOriginNote}</p>
      </div>

      {/* Educational notes */}
      {showTooltips && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Educational Notes</h4>
          <p className="text-xs text-blue-700 mb-2">{commodity.educationalNote}</p>
          <p className="text-xs text-blue-600 italic">{commodity.classificationNote}</p>
        </div>
      )}

      {/* Alerts */}
      {result.alerts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Validation & Alerts</h4>
          {result.alerts.map((alert, i) => (
            <AlertDisplay key={i} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Compare mode — side by side */
function CompareDisplay({
  comparison,
  showTooltips,
}: {
  comparison: CountryComparison;
  showTooltips: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <BreadcrumbDisplay commodity={comparison.commodity} />
        <h3 className="text-lg font-bold text-gray-900">{comparison.commodity.description}</h3>
        <p className="text-sm text-gray-600 mt-1 font-mono">{formatCode(comparison.commodity.code)}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[comparison.countryA, comparison.countryB].map((result) => (
          <div key={result.country.code} className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-3">{result.country.name}</h4>
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="font-medium text-gray-500">Scheme</dt>
                <dd className="text-gray-900">{result.country.schemeName}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Duty</dt>
                <dd className="text-lg font-bold text-gray-900">{result.effectiveDutyDisplay}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Import VAT</dt>
                <dd className="text-gray-900">{result.vatPercent}%</dd>
              </div>
              {result.applicableRemedies.length > 0 && (
                <div>
                  <dt className="font-medium text-red-600">Trade Remedies</dt>
                  <dd className="text-red-700">{result.applicableRemedies.map((r) => `${r.type}: ${r.displayRate}`).join(', ')}</dd>
                </div>
              )}
            </dl>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 text-white rounded-lg p-4 text-center">
        <div className="text-xs uppercase text-gray-400 mb-1">Duty Difference</div>
        <div className="text-2xl font-bold">{comparison.dutyDifference.toFixed(2)} percentage points</div>
        <div className="text-sm text-gray-300 mt-1">{comparison.comparisonNote}</div>
      </div>
    </div>
  );
}

// ─── Helper Functions ───────────────────────────────────────────────────────────

/** Format a 10-digit code with dots for readability: 1509.20.00.90 */
function formatCode(code: string): string {
  if (code.length !== 10) return code;
  return `${code.slice(0, 4)}.${code.slice(4, 6)}.${code.slice(6, 8)}.${code.slice(8, 10)}`;
}

// ─── Main Component ─────────────────────────────────────────────────────────────

/**
 * UK Trade Tariff Lookup — Main React Component
 *
 * Provides three search modes (text, browse, direct entry), country of origin
 * selection, full duty picture display, and optional compare mode.
 */
export function UKTradeTariffLookup({
  config,
  callbacks,
  showTooltips = true,
  showCompare = true,
  className,
}: UKTradeTariffLookupProps) {
  // State
  const [mode, setMode] = useState<SearchMode>(config.initialMode);
  const [selectedCode, setSelectedCode] = useState<string | null>(config.preSelectedCode ?? null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(config.preSelectedCountry ?? null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareCountryA, setCompareCountryA] = useState<string | null>(null);
  const [compareCountryB, setCompareCountryB] = useState<string | null>(null);
  const [showScenarios, setShowScenarios] = useState(false);

  // Computed results
  const lookupResult = useMemo(() => {
    if (!selectedCode || !selectedCountry) return null;
    return performLookup(selectedCode, selectedCountry);
  }, [selectedCode, selectedCountry]);

  const comparisonResult = useMemo(() => {
    if (!selectedCode || !compareCountryA || !compareCountryB) return null;
    return compareCountries(selectedCode, compareCountryA, compareCountryB);
  }, [selectedCode, compareCountryA, compareCountryB]);

  // Handlers
  const handleCodeSelect = useCallback((code: string) => {
    setSelectedCode(code);
    callbacks?.onCodeSelect?.({
      commodityCode: code,
      description: getCommodityByCode(code)?.shortDescription ?? '',
      timestamp: Date.now(),
    });
  }, [callbacks]);

  const handleCountrySelect = useCallback((countryCode: string) => {
    setSelectedCountry(countryCode);
    const country = getCountryByCode(countryCode);
    callbacks?.onCountrySelect?.({
      countryCode,
      countryName: country?.name ?? '',
      hasPreference: country?.preferenceScheme !== 'mfn',
      timestamp: Date.now(),
    });
  }, [callbacks]);

  const handleModeChange = useCallback((newMode: SearchMode) => {
    setMode(newMode);
    callbacks?.onBrowse?.({
      level: 'section',
      code: '',
      timestamp: Date.now(),
    });
  }, [callbacks]);

  const handleReset = useCallback(() => {
    const prev = selectedCode;
    setSelectedCode(null);
    setSelectedCountry(config.preSelectedCountry ?? null);
    setCompareMode(false);
    setCompareCountryA(null);
    setCompareCountryB(null);
    callbacks?.onReset?.({
      previousCode: prev,
      timestamp: Date.now(),
    });
  }, [selectedCode, config.preSelectedCountry, callbacks]);

  const handleLoadScenario = useCallback((scenario: HCTariffScenario) => {
    setMode(scenario.config.initialMode);
    setSelectedCode(scenario.expectedCode);
    setSelectedCountry(scenario.expectedCountry);
    setShowScenarios(false);
  }, []);

  // Fire onResultView when a result is displayed
  React.useEffect(() => {
    if (lookupResult) {
      callbacks?.onResultView?.({
        commodityCode: lookupResult.commodity.code,
        country: lookupResult.country.code,
        effectiveDuty: lookupResult.effectiveDutyPercent,
        vatRate: lookupResult.vatPercent,
        timestamp: Date.now(),
      });
    }
  }, [lookupResult, callbacks]);

  return (
    <div className={`max-w-4xl mx-auto ${className ?? ''}`}>
      {/* Tool header */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">UK Trade Tariff Lookup</h2>
            <p className="text-sm text-gray-500">
              Simulates trade-tariff.service.gov.uk — classify goods, determine duty rates, and check import controls
            </p>
          </div>
          <div className="flex gap-2">
            {showCompare && config.compareEnabled && selectedCode && (
              <button
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  compareMode ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setCompareMode(!compareMode)}
              >
                Compare Countries
              </button>
            )}
            <button
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              onClick={() => setShowScenarios(!showScenarios)}
            >
              H&C Scenarios
            </button>
            {selectedCode && (
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                onClick={handleReset}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scenario selector */}
      {showScenarios && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">H&C Case Study Scenarios</h3>
          <div className="space-y-2">
            {HC_TARIFF_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-200 transition-colors"
                onClick={() => handleLoadScenario(scenario)}
              >
                <div className="text-sm font-medium text-gray-900">{scenario.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{scenario.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <ModeSelector mode={mode} onModeChange={handleModeChange} />

        {mode === 'text' && (
          <TextSearch onSelect={handleCodeSelect} showTooltips={showTooltips} />
        )}
        {mode === 'browse' && (
          <HierarchyBrowse onSelect={handleCodeSelect} showTooltips={showTooltips} />
        )}
        {mode === 'direct' && (
          <DirectEntry
            onSelect={handleCodeSelect}
            preSelectedCode={config.preSelectedCode}
            showTooltips={showTooltips}
          />
        )}
      </div>

      {/* Country selection + results */}
      {selectedCode && !compareMode && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <CountrySelector
            selectedCountry={selectedCountry}
            onSelect={handleCountrySelect}
            showTooltips={showTooltips}
          />

          {lookupResult && <ResultDisplay result={lookupResult} showTooltips={showTooltips} />}
        </div>
      )}

      {/* Compare mode */}
      {selectedCode && compareMode && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Compare Countries</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Country A</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={compareCountryA ?? ''}
                onChange={(e) => setCompareCountryA(e.target.value || null)}
              >
                <option value="">Select...</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Country B</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={compareCountryB ?? ''}
                onChange={(e) => setCompareCountryB(e.target.value || null)}
              >
                <option value="">Select...</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {comparisonResult && (
            <CompareDisplay comparison={comparisonResult} showTooltips={showTooltips} />
          )}
        </div>
      )}
    </div>
  );
}

export default UKTradeTariffLookup;
