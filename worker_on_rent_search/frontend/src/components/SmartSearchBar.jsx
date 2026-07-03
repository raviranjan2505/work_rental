import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaSearch, FaTimes, FaClock, FaMicrophone } from 'react-icons/fa'
import { MdWorkOutline } from 'react-icons/md'
import { useSelector } from 'react-redux'
import useSearchWorkers from '../hooks/useSearchWorkers'

const RECENT_KEY = 'mor_recent_searches'
const MAX_RECENT = 6

const QUICK_SUGGESTIONS = [
    'Driver', 'Maid', 'Electrician', 'Cook', 'Plumber',
    'Carpenter', 'AC Repair', 'Cleaner', 'Painter', 'Mechanic'
]

// Wrap matched portion in a <mark> tag
function HighlightText({ text = '', query = '' }) {
    if (!query.trim()) return <span>{text}</span>
    const parts = text.split(new RegExp(`(${query.trim()})`, 'gi'))
    return (
        <span>
            {parts.map((p, i) =>
                p.toLowerCase() === query.trim().toLowerCase()
                    ? <mark key={i} className='bg-[#ff4d2d]/15 text-[#ff4d2d] font-semibold rounded px-0.5 not-italic'>{p}</mark>
                    : <span key={i}>{p}</span>
            )}
        </span>
    )
}

function formatDistance(m) {
    if (!m && m !== 0) return ''
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}

export default function SmartSearchBar({ onSearch, onClear, className = '' }) {
    const navigate = useNavigate()
    const { userData } = useSelector(state => state.user)
    const mapState = useSelector(state => state.map)
    const lat = mapState?.lat
    const lng = mapState?.lng

    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [recent, setRecent] = useState(() => {
        try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || [] } catch { return [] }
    })

    const inputRef = useRef(null)
    const wrapperRef = useRef(null)
    const { results, categorySuggestions, loading, search, clear } = useSearchWorkers()

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleChange = (val) => {
        setQuery(val)
        setOpen(true)
        search(val, lat, lng)
        if (!val.trim()) { clear(); onClear?.() }
    }

    const saveRecent = (q) => {
        const next = [q, ...recent.filter(r => r !== q)].slice(0, MAX_RECENT)
        setRecent(next)
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch { }
    }

    const handleSubmit = (q = query) => {
        if (!q.trim()) return
        saveRecent(q.trim())
        setOpen(false)
        search(q.trim(), lat, lng)
        onSearch?.(q.trim())
    }

    const handleWorkerClick = (worker) => {
        saveRecent(worker.user?.fullName || query)
        setOpen(false)
        navigate(`/worker/${worker.user?._id}`)
    }

    const handleCategoryClick = (catName) => {
        saveRecent(catName)
        setQuery(catName)
        setOpen(false)
        search(catName, lat, lng)
        onSearch?.(catName)
    }

    const handleClear = () => {
        setQuery('')
        clear()
        onClear?.()
        inputRef.current?.focus()
    }

    const removeRecent = (r, e) => {
        e.stopPropagation()
        const next = recent.filter(x => x !== r)
        setRecent(next)
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch { }
    }

    const handleVoice = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        const rec = new SR()
        rec.lang = 'en-IN'
        rec.onresult = (e) => {
            const transcript = e.results[0][0].transcript
            setQuery(transcript)
            handleSubmit(transcript)
        }
        rec.start()
    }

    const showDropdown = open && (query.length === 0
        ? (recent.length > 0)
        : (loading || results.length > 0 || categorySuggestions.length > 0 || true))

    return (
        <div ref={wrapperRef} className={`relative w-full ${className}`}>
            {/* ── INPUT ── */}
            <div className={`flex items-center bg-white border-2 rounded-2xl px-4 gap-3 transition-all duration-200 shadow-sm
                ${open ? 'border-[#ff4d2d] shadow-[#ff4d2d]/10 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                <FaSearch size={15} className={`shrink-0 ${open ? 'text-[#ff4d2d]' : 'text-gray-400'}`} />

                <input
                    ref={inputRef}
                    type='text'
                    value={query}
                    placeholder='Search workers, services, skills...'
                    className='flex-1 py-3 md:py-3.5 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm md:text-base'
                    onChange={e => handleChange(e.target.value)}
                    onFocus={() => setOpen(true)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') handleSubmit()
                        if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
                    }}
                />

                {/* right icons */}
                <div className='flex items-center gap-2 shrink-0'>
                    {query && (
                        <button onClick={handleClear} className='p-1 text-gray-400 hover:text-gray-600 transition-colors'>
                            <FaTimes size={13} />
                        </button>
                    )}
                    <button onClick={handleVoice}
                        className='p-1 text-gray-400 hover:text-[#ff4d2d] transition-colors md:hidden'
                        title='Voice search'>
                        <FaMicrophone size={14} />
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        className='hidden md:flex items-center gap-1.5 bg-[#ff4d2d] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#e64323] transition-colors'
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* ── DROPDOWN ── */}
            {showDropdown && (
                <div className='absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-[9998] overflow-hidden max-h-[70vh] md:max-h-[420px] overflow-y-auto'>

                    {/* Empty query: show recent + quick suggestions */}
                    {!query.trim() && (
                        <>
                            {recent.length > 0 && (
                                <div className='px-4 pt-4 pb-2'>
                                    <p className='text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-3'>Recent Searches</p>
                                    <div className='flex flex-col gap-0.5'>
                                        {recent.map((r, i) => (
                                            <div key={i}
                                                className='flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 cursor-pointer group'
                                                onClick={() => { setQuery(r); handleSubmit(r) }}>
                                                <FaClock size={12} className='text-gray-300 shrink-0' />
                                                <span className='flex-1 text-sm text-gray-700'>{r}</span>
                                                <button onClick={(e) => removeRecent(r, e)}
                                                    className='opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 transition-opacity'>
                                                    <FaTimes size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className='px-4 py-4 border-t border-gray-50'>
                                <p className='text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-3'>Popular Searches</p>
                                <div className='flex flex-wrap gap-2'>
                                    {QUICK_SUGGESTIONS.map((s, i) => (
                                        <button key={i}
                                            onClick={() => { setQuery(s); handleSubmit(s) }}
                                            className='px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-[#fff0eb] hover:text-[#ff4d2d] text-gray-600 rounded-full border border-gray-200 transition-colors'>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Active query results */}
                    {query.trim() && (
                        <>
                            {loading && (
                                <div className='flex items-center justify-center py-8 gap-2 text-gray-400'>
                                    <div className='w-4 h-4 border-2 border-[#ff4d2d]/30 border-t-[#ff4d2d] rounded-full animate-spin' />
                                    <span className='text-sm'>Searching…</span>
                                </div>
                            )}

                            {/* Category suggestions */}
                            {!loading && categorySuggestions.length > 0 && (
                                <div className='px-4 pt-4 pb-2'>
                                    <p className='text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-2'>Categories</p>
                                    {categorySuggestions.map((cat, i) => (
                                        <div key={i}
                                            className='flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-[#fff0eb] cursor-pointer'
                                            onClick={() => handleCategoryClick(cat.name)}>
                                            <div className='w-8 h-8 rounded-lg bg-[#ff4d2d]/10 flex items-center justify-center shrink-0'>
                                                <MdWorkOutline size={16} className='text-[#ff4d2d]' />
                                            </div>
                                            <div>
                                                <p className='text-sm font-medium text-gray-800'>
                                                    <HighlightText text={cat.name} query={query} />
                                                </p>
                                                <p className='text-[11px] text-gray-400'>{cat.group}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Worker results */}
                            {!loading && results.length > 0 && (
                                <div className={`px-4 py-3 ${categorySuggestions.length > 0 ? 'border-t border-gray-50' : 'pt-4'}`}>
                                    <p className='text-[11px] uppercase font-bold text-gray-400 tracking-wider mb-2'>Workers</p>
                                    <div className='flex flex-col gap-0.5'>
                                        {results.slice(0, 6).map((w, i) => (
                                            <div key={i}
                                                className='flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer'
                                                onClick={() => handleWorkerClick(w)}>
                                                <div className='relative w-9 h-9 shrink-0'>
                                                    <img src={w.profileImage || '/vite.svg'} alt=''
                                                        className='w-full h-full rounded-full object-cover border border-gray-200' />
                                                    {w.kyc?.isVerified && (
                                                        <span className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white' title='Verified' />
                                                    )}
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <p className='text-sm font-semibold text-gray-800 truncate'>
                                                        <HighlightText text={w.user?.fullName || ''} query={query} />
                                                    </p>
                                                    <p className='text-xs text-gray-400 truncate'>
                                                        <HighlightText text={w.category?.name || ''} query={query} />
                                                        {w.skills?.length > 0 && (
                                                            <span className='ml-1 text-gray-300'>
                                                                · <HighlightText text={w.skills.slice(0, 2).join(', ')} query={query} />
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className='text-right shrink-0'>
                                                    <p className='text-xs font-bold text-[#ff4d2d]'>₹{w.hourlyRate}/hr</p>
                                                    {w.distanceInMeters != null && (
                                                        <p className='text-[10px] text-gray-400'>{formatDistance(w.distanceInMeters)}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {results.length > 6 && (
                                        <button
                                            onClick={() => handleSubmit()}
                                            className='w-full mt-2 py-2 text-xs font-semibold text-[#ff4d2d] hover:bg-[#fff0eb] rounded-xl transition-colors'>
                                            View all {results.length} results →
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Empty state */}
                            {!loading && results.length === 0 && categorySuggestions.length === 0 && (
                                <div className='px-6 py-8 text-center'>
                                    <p className='text-2xl mb-2'>🔍</p>
                                    <p className='font-semibold text-gray-700 text-sm'>No workers found for "{query}"</p>
                                    <p className='text-xs text-gray-400 mt-1 mb-4'>Try searching for:</p>
                                    <div className='flex flex-wrap gap-2 justify-center'>
                                        {['Driver', 'Maid', 'Electrician', 'Cook'].map(s => (
                                            <button key={s}
                                                onClick={() => { setQuery(s); handleSubmit(s) }}
                                                className='px-3 py-1.5 text-xs text-[#ff4d2d] border border-[#ff4d2d]/30 bg-[#fff0eb] rounded-full hover:bg-[#ff4d2d] hover:text-white transition-colors'>
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
