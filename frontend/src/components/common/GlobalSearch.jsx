import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, FolderKanban, Package, MessageSquare, Loader } from 'lucide-react';
import { workerAPI, projectAPI, inventoryAPI, messageAPI } from '../../services/api';

const SECTIONS = [
  { key: 'workers', label: 'Workers', icon: Users, path: '/workers', color: 'text-blue-600' },
  { key: 'projects', label: 'Projects', icon: FolderKanban, path: '/projects', color: 'text-purple-600' },
  { key: 'inventory', label: 'Inventory', icon: Package, path: '/inventory', color: 'text-green-600' },
  { key: 'messages', label: 'Messages', icon: MessageSquare, path: '/messages', color: 'text-orange-600' }
];

const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults({}); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query.trim()), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const runSearch = async (q) => {
    setLoading(true);
    setOpen(true);
    try {
      const [workers, projects, inventory, messages] = await Promise.allSettled([
        workerAPI.getAll({ search: q }),
        projectAPI.getAll({ search: q }),
        inventoryAPI.getAll({ search: q }),
        messageAPI.getAll({ search: q })
      ]);

      const filter = (res, fields) => {
        const items = res.status === 'fulfilled' ? (res.value.data || []) : [];
        return items.filter(item => fields.some(f => item[f]?.toLowerCase().includes(q.toLowerCase())));
      };

      setResults({
        workers: filter(workers, ['full_name', 'position', 'phone']),
        projects: filter(projects, ['name', 'description', 'location']),
        inventory: filter(inventory, ['name', 'category', 'description']),
        messages: filter(messages, ['subject', 'message'])
      });
    } catch {}
    setLoading(false);
  };

  const totalResults = Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  const handleSelect = (path) => {
    navigate(path);
    setQuery('');
    setOpen(false);
  };

  const getItemLabel = (key, item) => {
    switch (key) {
      case 'workers': return { primary: item.full_name, secondary: `${item.position} · ${item.payment_type}` };
      case 'projects': return { primary: item.name, secondary: item.status || item.location || '' };
      case 'inventory': return { primary: item.name, secondary: `${item.category || ''} · Qty: ${item.quantity ?? ''}` };
      case 'messages': return { primary: item.subject, secondary: item.message?.slice(0, 60) + '...' };
      default: return { primary: '', secondary: '' };
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search workers, projects, inventory..."
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults({}); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-gray-500 text-sm">
              <Loader size={16} className="animate-spin" /> Searching...
            </div>
          ) : totalResults === 0 ? (
            <div className="py-6 text-center text-gray-400 text-sm">No results for "{query}"</div>
          ) : (
            SECTIONS.map(({ key, label, icon: Icon, path, color }) => {
              const items = results[key] || [];
              if (!items.length) return null;
              return (
                <div key={key}>
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <Icon size={13} className={color} />
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
                    <span className="ml-auto text-xs text-gray-400">{items.length}</span>
                  </div>
                  {items.slice(0, 4).map((item, i) => {
                    const { primary, secondary } = getItemLabel(key, item);
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelect(path)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <p className="text-sm font-medium text-gray-800 truncate">{primary}</p>
                        {secondary && <p className="text-xs text-gray-500 truncate">{secondary}</p>}
                      </button>
                    );
                  })}
                  {items.length > 4 && (
                    <button onClick={() => handleSelect(path)} className="w-full text-xs text-blue-600 hover:text-blue-800 py-2 px-4 text-left hover:bg-blue-50">
                      +{items.length - 4} more in {label}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
