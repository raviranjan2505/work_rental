import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axios from 'axios'
import {
    FaArrowLeft, FaSearch, FaTimes, FaStar, FaCheckCircle,
    FaFilter, FaSlidersH, FaChevronDown, FaMapMarkerAlt, FaSort
} from 'react-icons/fa'
import { MdVerified } from 'react-icons/md'
import { serverUrl } from '../App'
import useGetCategories from '../hooks/useGetCategories'
import WorkerCardSkeleton from '../components/WorkerCardSkeleton'

// ── helpers ───────────────────────────────────────────────────────────────────
function formatDist(m) {
    if (m == null) return ''
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`
}

const SORT_OPTIONS = [
    { value: 'distance',       label: '📍 Nearest First' },
    { value: 'rating',         label: '⭐ Top Rated' },
    { value: 'priceLowToHigh', label: '💸 Price: Low → High' },
    { value: 'priceHighToLow', label: '💰 Price: High → Low' },
]
const RADIUS_OPTIONS = [
    { value: '2',  label: '2 km' },
    { value: '5',  label: '5 km' },
    { value: '10', label: '10 km' },
    { value: '25', label: '25 km' },
    { value: '50', label: '50 km' },
]
const RATING_OPTIONS = [
    { value: '',  label: 'Any Rating' },
    { value: '4', label: '4 ★ & above' },
    { value: '3', label: '3 ★ & above' },
    { value: '2', label: '2 ★ & above' },
]

// ── single worker card (inline, no import needed) ─────────────────────────────
function WorkerRow({ worker }) {
    const navigate = useNavigate()
    const { userData } = useSelector(state => state.user)

    const book = (e) => {
        e.stopPropagation()
        if (!userData) navigate('/signin')
        else navigate(`/book/${worker.user?._id}`)
    }

    return (
        <div
            onClick={() => navigate(`/worker/${worker.user?._id}`)}
            className='bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all cursor-pointer p-4 flex gap-4'
        >
            {/* avatar */}
            <div className='relative w-[60px] h-[60px] md:w-[72px] md:h-[72px] shrink-0'>
                <img
                    src={worker.profileImage || '/vite.svg'} alt=''
                    className='w-full h-full object-cover rounded-full border-2 border-[#ff4d2d]'
                />
                {worker.isOnline && (
                    <span className='absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white' />
                )}
            </div>

            {/* info */}
            <div className='flex-1 min-w-0'>
                <div className='flex items-start justify-between gap-2'>
                    <div className='min-w-0'>
                        <div className='flex items-center gap-1 flex-wrap'>
                            <p className='font-bold text-gray-800 text-sm md:text-base truncate'>
                                {worker.user?.fullName}
                            </p>
                            {worker.kyc?.isVerified && (
                                <MdVerified size={15} className='text-[#ff4d2d] shrink-0' />
                            )}
                        </div>
                        <p className='text-xs md:text-sm text-gray-500 mt-0.5'>{worker.category?.name}</p>

                        {/* skills */}
                        {worker.skills?.length > 0 && (
                            <div className='flex flex-wrap gap-1 mt-1.5'>
                                {worker.skills.slice(0, 3).map((s, i) => (
                                    <span key={i} className='text-[10px] bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full'>
                                        {s}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* stats row */}
                        <div className='flex items-center gap-2 mt-1.5 text-xs text-gray-500 flex-wrap'>
                            <span className='flex items-center gap-1'>
                                <FaStar className='text-yellow-400' size={10} />
                                <span className='font-semibold text-gray-700'>
                                    {worker.rating?.average?.toFixed(1) || 'New'}
                                </span>
                                {worker.rating?.count > 0 && (
                                    <span className='text-gray-400'>({worker.rating.count})</span>
                                )}
                            </span>
                            <span className='text-gray-200'>·</span>
                            <span>{worker.completedJobs || 0} jobs</span>
                            {worker.experienceYears > 0 && (
                                <>
                                    <span className='text-gray-200'>·</span>
                                    <span>{worker.experienceYears} yrs exp</span>
                                </>
                            )}
                            {worker.distanceInMeters != null && (
                                <>
                                    <span className='text-gray-200'>·</span>
                                    <FaMapMarkerAlt size={9} className='text-[#ff4d2d]' />
                                    <span>{formatDist(worker.distanceInMeters)} away</span>
                                </>
                            )}
                        </div>

                        {/* verified chips */}
                        {worker.kyc?.isVerified && (
                            <span className='inline-flex items-center gap-1 mt-1.5 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium'>
                                <FaCheckCircle size={9} /> Background Verified
                            </span>
                        )}
                    </div>

                    {/* price + buttons */}
                    <div className='flex flex-col items-end gap-2 shrink-0'>
                        <p className='font-extrabold text-[#ff4d2d] text-base md:text-lg'>
                            ₹{worker.hourlyRate}
                            <span className='text-[10px] text-gray-400 font-normal'>/hr</span>
                        </p>
                        <div className='flex gap-2'>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/worker/${worker.user?._id}`) }}
                                className='hidden md:block px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:border-[#ff4d2d] hover:text-[#ff4d2d] transition-colors font-medium'
                            >
                                Profile
                            </button>
                            <button
                                onClick={book}
                                className='px-3 py-1.5 text-xs rounded-lg bg-[#ff4d2d] text-white font-semibold hover:bg-[#e64323] transition-colors'
                            >
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── filter pill (mobile + desktop reuse) ──────────────────────────────────────
function Pill({ label, active, onClick, onClear }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0
                ${active
                    ? 'bg-[#ff4d2d] text-white border-[#ff4d2d]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#ff4d2d] hover:text-[#ff4d2d]'}`}
        >
            {label}
            {active && onClear && (
                <FaTimes size={9} onClick={(e) => { e.stopPropagation(); onClear() }} />
            )}
        </button>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AllWorkersPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { location } = useSelector(state => state.map)
    const { currentCity } = useSelector(state => state.user)
    const { categories: dbCategories } = useSelector(state => state.worker)

    useGetCategories()

    // ── filter state ──────────────────────────────────────────────────────────
    const [filters, setFilters] = useState({
        category:   searchParams.get('category') || '',
        minRating:  '',
        minPrice:   '',
        maxPrice:   '',
        radius:     '10',
        sort:       'distance',
        rateType:   'hourly',
    })  
    const [localSearch, setLocalSearch] = useState('')   // client-side name filter
    const [showFilters, setShowFilters] = useState(false) // mobile filter panel

    // ── data state ────────────────────────────────────────────────────────────
    const [workers, setWorkers]     = useState([])
    const [loading, setLoading]     = useState(false)
    const [page, setPage]           = useState(1)
    const [hasMore, setHasMore]     = useState(true)
    const [totalSeen, setTotalSeen] = useState(0)
    const LIMIT = 20

    // ── fetch ─────────────────────────────────────────────────────────────────
    const fetch = useCallback(async (pageNum = 1, reset = false) => {
        if (!location?.lat || !location?.lon) return
        setLoading(true)
        try {
            const params = {
                lat: location.lat, lng: location.lon,
                page: pageNum, limit: LIMIT,
                radius:    filters.radius,
                sort:      filters.sort,
                rateType:  filters.rateType,
                ...(filters.category  && { category:  filters.category }),
                ...(filters.minRating && { minRating: filters.minRating }),
                ...(filters.minPrice  && { minPrice:  filters.minPrice }),
                ...(filters.maxPrice  && { maxPrice:  filters.maxPrice }),
            }
            const { data } = await axios.get(`${serverUrl}/api/worker/search/nearby`, {
                params, withCredentials: true
            })
            const incoming = data.workers || []
            setWorkers(prev => reset ? incoming : [...prev, ...incoming])
            setHasMore(incoming.length === LIMIT)
            setTotalSeen(reset ? incoming.length : prev => prev + incoming.length)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [location, filters])

    // refetch when filters change
    useEffect(() => {
        setPage(1)
        setWorkers([])
        setHasMore(true)
        fetch(1, true)
    }, [JSON.stringify(filters), location?.lat, location?.lon])

    // load more
    const loadMore = () => {
        const next = page + 1
        setPage(next)
        fetch(next)
    }

    // ── displayed workers (client-side name filter) ───────────────────────────
    const displayed = localSearch.trim()
        ? workers.filter(w =>
            w.user?.fullName?.toLowerCase().includes(localSearch.toLowerCase()) ||
            w.category?.name?.toLowerCase().includes(localSearch.toLowerCase()) ||
            w.skills?.some(s => s.toLowerCase().includes(localSearch.toLowerCase()))
        )
        : workers

    // ── active filter count (for badge) ──────────────────────────────────────
    const activeCount = [
        filters.category, filters.minRating, filters.minPrice || filters.maxPrice
    ].filter(Boolean).length

    const update = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))
    const resetFilters = () => setFilters({ category: '', minRating: '', minPrice: '', maxPrice: '', radius: '10', sort: 'distance', rateType: 'hourly' })

    const activeSortLabel = SORT_OPTIONS.find(s => s.value === filters.sort)?.label || 'Sort'
    const activeCatLabel  = dbCategories.find(c => c._id === filters.category)?.name

    return (
        <div className='w-full min-h-screen bg-[#fff9f6] pt-[80px] pb-24 md:pb-10'>

            {/* ── STICKY HEADER ── */}
            <div className='sticky top-[80px] z-[800] bg-white border-b border-gray-100 shadow-sm'>
                <div className='max-w-7xl mx-auto px-4 md:px-6'>

                    {/* title row */}
                    <div className='flex items-center gap-3 py-3 md:py-4'>
                        <button onClick={() => navigate(-1)}
                            className='p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors shrink-0'>
                            <FaArrowLeft size={15} />
                        </button>
                        <div className='flex-1 min-w-0'>
                            <h1 className='text-lg md:text-2xl font-extrabold text-gray-900'>Workers Near You</h1>
                            <p className='text-xs text-gray-400 flex items-center gap-1'>
                                <FaMapMarkerAlt size={9} className='text-[#ff4d2d]' />
                                {currentCity || 'Detecting location…'}
                                {!loading && <span className='ml-1'>· {workers.length} found</span>}
                            </p>
                        </div>

                        {/* mobile filter toggle */}
                        <button
                            onClick={() => setShowFilters(p => !p)}
                            className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors
                                ${activeCount > 0
                                    ? 'bg-[#ff4d2d] text-white border-[#ff4d2d]'
                                    : 'bg-white text-gray-600 border-gray-200'}`}
                        >
                            <FaSlidersH size={13} />
                            {activeCount > 0 && <span className='text-xs font-bold'>{activeCount}</span>}
                        </button>
                    </div>

                    {/* ── DESKTOP filter bar ── */}
                    <div className='hidden md:flex items-center gap-3 pb-4 flex-wrap'>

                        {/* local search */}
                        <div className='flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 gap-2 focus-within:border-[#ff4d2d] transition-colors'>
                            <FaSearch size={12} className='text-gray-400' />
                            <input
                                type='text' value={localSearch}
                                onChange={e => setLocalSearch(e.target.value)}
                                placeholder='Search by name or skill…'
                                className='py-2 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 w-48'
                            />
                            {localSearch && <FaTimes size={11} className='text-gray-400 cursor-pointer' onClick={() => setLocalSearch('')} />}
                        </div>

                        {/* category */}
                        <select value={filters.category} onChange={e => update('category', e.target.value)}
                            className='border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#ff4d2d] cursor-pointer'>
                            <option value=''>All Categories</option>
                            {dbCategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>

                        {/* rating */}
                        <select value={filters.minRating} onChange={e => update('minRating', e.target.value)}
                            className='border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#ff4d2d] cursor-pointer'>
                            {RATING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>

                        {/* radius */}
                        <select value={filters.radius} onChange={e => update('radius', e.target.value)}
                            className='border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#ff4d2d] cursor-pointer'>
                            {RADIUS_OPTIONS.map(o => <option key={o.value} value={o.value}>Within {o.label}</option>)}
                        </select>

                        {/* sort */}
                        <select value={filters.sort} onChange={e => update('sort', e.target.value)}
                            className='border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#ff4d2d] cursor-pointer'>
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>

                        {/* price range */}
                        <div className='flex items-center gap-1.5'>
                            <input type='number' value={filters.minPrice} onChange={e => update('minPrice', e.target.value)}
                                placeholder='Min ₹'
                                className='w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#ff4d2d]' />
                            <span className='text-gray-400 text-sm'>–</span>
                            <input type='number' value={filters.maxPrice} onChange={e => update('maxPrice', e.target.value)}
                                placeholder='Max ₹'
                                className='w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#ff4d2d]' />
                        </div>

                        {activeCount > 0 && (
                            <button onClick={resetFilters}
                                className='flex items-center gap-1.5 text-sm text-[#ff4d2d] font-semibold hover:underline'>
                                <FaTimes size={11} /> Reset
                            </button>
                        )}
                    </div>

                    {/* ── MOBILE pill row ── */}
                    <div className='md:hidden flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1'>
                        {/* sort pill */}
                        <Pill
                            label={<span className='flex items-center gap-1'><FaSort size={10} />{filters.sort === 'distance' ? 'Nearest' : filters.sort === 'rating' ? 'Top Rated' : filters.sort === 'priceLowToHigh' ? 'Price ↑' : 'Price ↓'}</span>}
                            active={filters.sort !== 'distance'}
                            onClick={() => {
                                const idx = SORT_OPTIONS.findIndex(s => s.value === filters.sort)
                                update('sort', SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].value)
                            }}
                        />
                        {/* category pill */}
                        <Pill
                            label={activeCatLabel || 'Category'}
                            active={!!filters.category}
                            onClick={() => {}} // opens filter panel
                            onClear={() => update('category', '')}
                        />
                        {/* rating pill */}
                        <Pill
                            label={filters.minRating ? `${filters.minRating}★+` : 'Rating'}
                            active={!!filters.minRating}
                            onClick={() => {
                                const opts = ['', '4', '3', '2']
                                const idx = opts.indexOf(filters.minRating)
                                update('minRating', opts[(idx + 1) % opts.length])
                            }}
                            onClear={() => update('minRating', '')}
                        />
                        {/* radius pill */}
                        <Pill
                            label={`${filters.radius} km`}
                            active={filters.radius !== '10'}
                            onClick={() => {
                                const opts = RADIUS_OPTIONS.map(r => r.value)
                                const idx = opts.indexOf(filters.radius)
                                update('radius', opts[(idx + 1) % opts.length])
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ── MOBILE FILTER PANEL (slide down) ── */}
            {showFilters && (
                <div className='md:hidden bg-white border-b border-gray-100 shadow-lg z-[700] relative'>
                    <div className='px-4 py-5 space-y-4'>
                        <div className='flex items-center justify-between mb-2'>
                            <p className='font-bold text-gray-800'>Filters</p>
                            <button onClick={resetFilters} className='text-xs text-[#ff4d2d] font-semibold'>Reset all</button>
                        </div>

                        {/* search */}
                        <div>
                            <p className='text-xs font-semibold text-gray-500 mb-2'>Search by name</p>
                            <div className='flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 gap-2'>
                                <FaSearch size={12} className='text-gray-400' />
                                <input type='text' value={localSearch} onChange={e => setLocalSearch(e.target.value)}
                                    placeholder='Worker name or skill…'
                                    className='flex-1 py-2.5 bg-transparent outline-none text-sm placeholder-gray-400' />
                            </div>
                        </div>

                        {/* category */}
                        <div>
                            <p className='text-xs font-semibold text-gray-500 mb-2'>Category</p>
                            <div className='flex flex-wrap gap-2'>
                                <button
                                    onClick={() => update('category', '')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                                        ${!filters.category ? 'bg-[#ff4d2d] text-white border-[#ff4d2d]' : 'bg-white text-gray-600 border-gray-200'}`}
                                >All</button>
                                {dbCategories.map(c => (
                                    <button key={c._id} onClick={() => update('category', c._id === filters.category ? '' : c._id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                                            ${filters.category === c._id ? 'bg-[#ff4d2d] text-white border-[#ff4d2d]' : 'bg-white text-gray-600 border-gray-200'}`}>
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* rating */}
                        <div>
                            <p className='text-xs font-semibold text-gray-500 mb-2'>Minimum Rating</p>
                            <div className='flex gap-2'>
                                {RATING_OPTIONS.map(o => (
                                    <button key={o.value} onClick={() => update('minRating', o.value)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                                            ${filters.minRating === o.value ? 'bg-[#ff4d2d] text-white border-[#ff4d2d]' : 'bg-white text-gray-600 border-gray-200'}`}>
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* radius */}
                        <div>
                            <p className='text-xs font-semibold text-gray-500 mb-2'>Distance</p>
                            <div className='flex gap-2'>
                                {RADIUS_OPTIONS.map(o => (
                                    <button key={o.value} onClick={() => update('radius', o.value)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                                            ${filters.radius === o.value ? 'bg-[#ff4d2d] text-white border-[#ff4d2d]' : 'bg-white text-gray-600 border-gray-200'}`}>
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* price range */}
                        <div>
                            <p className='text-xs font-semibold text-gray-500 mb-2'>Price Range (₹/hr)</p>
                            <div className='flex items-center gap-3'>
                                <input type='number' value={filters.minPrice} onChange={e => update('minPrice', e.target.value)}
                                    placeholder='Min ₹'
                                    className='flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#ff4d2d]' />
                                <span className='text-gray-400'>–</span>
                                <input type='number' value={filters.maxPrice} onChange={e => update('maxPrice', e.target.value)}
                                    placeholder='Max ₹'
                                    className='flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#ff4d2d]' />
                            </div>
                        </div>

                        {/* sort */}
                        <div>
                            <p className='text-xs font-semibold text-gray-500 mb-2'>Sort By</p>
                            <div className='flex flex-col gap-2'>
                                {SORT_OPTIONS.map(o => (
                                    <button key={o.value} onClick={() => update('sort', o.value)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all text-left
                                            ${filters.sort === o.value ? 'bg-[#fff0eb] border-[#ff4d2d] text-[#ff4d2d]' : 'bg-white border-gray-200 text-gray-600'}`}>
                                        {o.label}
                                        {filters.sort === o.value && <span className='ml-auto text-[#ff4d2d]'>✓</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={() => setShowFilters(false)}
                            className='w-full py-3 bg-[#ff4d2d] text-white font-bold rounded-xl'>
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}

            {/* ── WORKER LIST ── */}
            <div className='max-w-7xl mx-auto px-4 md:px-6 py-5'>

                {/* loading skeletons first load */}
                {loading && workers.length === 0 && (
                    <div className='flex flex-col gap-3'>
                        {[...Array(6)].map((_, i) => <WorkerCardSkeleton key={i} />)}
                    </div>
                )}

                {/* no location */}
                {!location?.lat && !loading && (
                    <div className='text-center py-20'>
                        <p className='text-5xl mb-4'>📍</p>
                        <p className='font-bold text-gray-700 text-lg'>Location required</p>
                        <p className='text-sm text-gray-400 mt-1'>Allow location access to see workers near you</p>
                    </div>
                )}

                {/* empty state */}
                {!loading && location?.lat && displayed.length === 0 && (
                    <div className='text-center py-20'>
                        <p className='text-5xl mb-4'>🔍</p>
                        <p className='font-bold text-gray-700 text-lg'>No workers found</p>
                        <p className='text-sm text-gray-400 mt-1 mb-5'>Try expanding the radius or removing a filter</p>
                        <button onClick={resetFilters}
                            className='px-6 py-2.5 bg-[#ff4d2d] text-white rounded-full font-semibold text-sm'>
                            Reset Filters
                        </button>
                    </div>
                )}

                {/* results */}
                {displayed.length > 0 && (
                    <>
                        {/* result summary */}
                        <div className='flex items-center justify-between mb-4'>
                            <p className='text-sm text-gray-500'>
                                Showing <span className='font-semibold text-gray-700'>{displayed.length}</span> workers
                                {activeCatLabel && <> in <span className='text-[#ff4d2d] font-semibold'>{activeCatLabel}</span></>}
                                {' '}within <span className='font-semibold text-gray-700'>{filters.radius} km</span>
                            </p>
                            {localSearch && (
                                <button onClick={() => setLocalSearch('')}
                                    className='text-xs text-[#ff4d2d] font-semibold flex items-center gap-1'>
                                    <FaTimes size={10} /> Clear name filter
                                </button>
                            )}
                        </div>

                        {/* cards */}
                        <div className='flex flex-col gap-3'>
                            {displayed.map((w, i) => <WorkerRow key={w._id || i} worker={w} />)}
                        </div>

                        {/* load more */}
                        {hasMore && !localSearch && (
                            <div className='flex justify-center mt-8'>
                                {loading
                                    ? <div className='flex items-center gap-2 text-gray-400 text-sm'>
                                        <div className='w-4 h-4 border-2 border-[#ff4d2d]/30 border-t-[#ff4d2d] rounded-full animate-spin' />
                                        Loading more…
                                    </div>
                                    : <button onClick={loadMore}
                                        className='px-8 py-3 border-2 border-[#ff4d2d] text-[#ff4d2d] font-bold rounded-xl hover:bg-[#ff4d2d] hover:text-white transition-colors'>
                                        Load More Workers
                                    </button>
                                }
                            </div>
                        )}

                        {!hasMore && workers.length > LIMIT && (
                            <p className='text-center text-sm text-gray-400 mt-8'>
                                All {workers.length} nearby workers shown
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
