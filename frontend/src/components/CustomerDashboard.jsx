import React, { useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
    FaMapMarkerAlt, FaStar, FaShieldAlt, FaHeadset, FaCheckCircle, FaTimes
} from 'react-icons/fa'
import { FaCalendarDays } from 'react-icons/fa6'
import { MdPriceCheck, MdVerified } from 'react-icons/md'
import WorkerCard from './WorkerCard'
import WorkerCardSkeleton from './WorkerCardSkeleton'
import SmartSearchBar from './SmartSearchBar'
import HighlightText from './HighlightText'
import useGetCategories from '../hooks/useGetCategories'
import useGetNearbyWorkers from '../hooks/useGetNearbyWorkers'
import useSearchWorkers from '../hooks/useSearchWorkers'
import { categories as localCategories } from '../category'
import heroBg from '../assets/home.png'

const TRUST_BADGES = [
    { icon: FaShieldAlt, title: 'Verified Professionals', sub: 'Background Checked', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: FaCalendarDays, title: 'Easy Booking', sub: 'Quick & Simple', color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: MdPriceCheck, title: 'Transparent Pricing', sub: 'No Hidden Charges', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: FaHeadset, title: '24/7 Support', sub: "We're Here to Help", color: 'text-purple-500', bg: 'bg-purple-50' },
]

const SORT_OPTIONS = [
    { value: 'distance', label: 'Nearest' },
    { value: 'rating', label: 'Top Rated' },
    { value: 'priceLowToHigh', label: 'Price ↑' },
    { value: 'priceHighToLow', label: 'Price ↓' },
]

const RADIUS_OPTIONS = [
    { value: '2', label: 'Within 2 km' },
    { value: '5', label: 'Within 5 km' },
    { value: '10', label: 'Within 10 km' },
    { value: '25', label: 'Within 25 km' },
]

const CATEGORY_PRICES = {
    Driver: 99, Cook: 149, Maid: 99, Sweeper: 89, Electrician: 149,
    Plumber: 149, Carpenter: 129, 'AC Technician': 199, Labour: 89,
    Painter: 129, Welder: 149, Gardener: 99, 'Security Guard': 119,
    'Office Boy': 89, 'Personal Assistant': 199, 'Bank Work Assistant': 149,
    'Delivery Boy': 79, 'Parcel Runner': 79,
}

function formatDistance(m) {
    if (m == null) return ''
    return m < 1000 ? `${Math.round(m)} m away` : `${(m / 1000).toFixed(1)} km away`
}

// Search result worker card (with highlight support)
function SearchWorkerCard({ worker, query }) {
    const navigate = useNavigate()
    const { userData } = useSelector(state => state.user)

    const handleBook = (e) => {
        e.stopPropagation()
        if (!userData) navigate('/signin')
        else navigate(`/book/${worker.user?._id}`)
    }

    return (
        <div
            onClick={() => navigate(`/worker/${worker.user?._id}`)}
            className='bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer p-4'
        >
            {/* Mobile */}
            <div className='flex gap-3 md:hidden'>
                <div className='relative w-[56px] h-[56px] shrink-0'>
                    <img src={worker.profileImage || '/vite.svg'} alt=''
                        className='w-full h-full object-cover rounded-full border-2 border-[#ff4d2d]' />
                    {worker.kyc?.isVerified && (
                        <span className='absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white' />
                    )}
                </div>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-1'>
                        <p className='font-semibold text-gray-800 text-sm'>
                            <HighlightText text={worker.user?.fullName || ''} query={query} />
                        </p>
                        {worker.kyc?.isVerified && <MdVerified size={13} className='text-[#ff4d2d]' />}
                    </div>
                    <p className='text-xs text-gray-500'>
                        <HighlightText text={worker.category?.name || ''} query={query} />
                    </p>
                    {worker.skills?.length > 0 && (
                        <p className='text-[10px] text-gray-400 mt-0.5'>
                            <HighlightText text={worker.skills.slice(0,3).join(' · ')} query={query} />
                        </p>
                    )}
                    <div className='flex items-center justify-between mt-2'>
                        <div className='flex items-center gap-1 text-xs'>
                            <FaStar className='text-yellow-400' size={10} />
                            <span>{worker.rating?.average?.toFixed(1) || 'New'}</span>
                            <span className='text-gray-300'>·</span>
                            <span className='text-gray-500'>{worker.completedJobs || 0} jobs</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <span className='font-bold text-[#ff4d2d] text-sm'>₹{worker.hourlyRate}/hr</span>
                            <button onClick={handleBook}
                                className='px-3 py-1 text-xs rounded-full bg-[#ff4d2d] text-white font-medium'>
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop */}
            <div className='hidden md:flex gap-4'>
                <div className='relative w-[68px] h-[68px] shrink-0'>
                    <img src={worker.profileImage || '/vite.svg'} alt=''
                        className='w-full h-full object-cover rounded-full border-2 border-[#ff4d2d]' />
                    {worker.kyc?.isVerified && (
                        <span className='absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white' />
                    )}
                </div>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-4'>
                        <div>
                            <div className='flex items-center gap-1.5'>
                                <p className='font-bold text-gray-800'>
                                    <HighlightText text={worker.user?.fullName || ''} query={query} />
                                </p>
                                {worker.kyc?.isVerified && <MdVerified size={16} className='text-[#ff4d2d]' />}
                            </div>
                            <p className='text-sm text-gray-500'>
                                <HighlightText text={worker.category?.name || ''} query={query} />
                            </p>
                            {worker.skills?.length > 0 && (
                                <p className='text-xs text-gray-400 mt-0.5'>
                                    Skills: <HighlightText text={worker.skills.slice(0,4).join(', ')} query={query} />
                                </p>
                            )}
                            <div className='flex items-center gap-2 mt-1 text-sm'>
                                <FaStar className='text-yellow-400' size={12} />
                                <span className='font-medium'>{worker.rating?.average?.toFixed(1) || 'New'}</span>
                                {worker.rating?.count > 0 && <span className='text-gray-400'>({worker.rating.count})</span>}
                                <span className='text-gray-300'>·</span>
                                <span className='text-gray-500'>{worker.completedJobs || 0} jobs</span>
                                {worker.experienceYears > 0 && <>
                                    <span className='text-gray-300'>·</span>
                                    <span className='text-gray-500'>{worker.experienceYears} yrs exp</span>
                                </>}
                            </div>
                            {worker.kyc?.isVerified && (
                                <span className='inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-2'>
                                    <FaCheckCircle size={9} /> Background Verified
                                </span>
                            )}
                        </div>
                        <div className='flex flex-col items-end gap-2 shrink-0'>
                            <div className='text-right'>
                                {worker.distanceInMeters != null && (
                                    <p className='text-xs text-gray-400'>{formatDistance(worker.distanceInMeters)}</p>
                                )}
                                <p className='font-bold text-[#ff4d2d] text-lg'>₹{worker.hourlyRate}<span className='text-xs text-gray-400 font-normal'>/hr</span></p>
                            </div>
                            <div className='flex gap-2'>
                                <button onClick={(e) => { e.stopPropagation(); navigate(`/worker/${worker.user?._id}`) }}
                                    className='px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:border-[#ff4d2d] hover:text-[#ff4d2d] transition-colors'>
                                    View Profile
                                </button>
                                <button onClick={handleBook}
                                    className='px-4 py-2 text-sm rounded-lg bg-[#ff4d2d] text-white font-semibold hover:bg-[#e64323] transition-colors'>
                                    Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function CustomerDashboard() {
    const navigate = useNavigate()
    const { currentCity, userData } = useSelector(state => state.user)
    const mapState = useSelector(state => state.map)
    const { categories: dbCategories, nearbyWorkers, searchLoading } = useSelector(state => state.worker)

    const [filters, setFilters] = useState({ radius: 10, sort: 'distance' })
    const [activeSlide, setActiveSlide] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearchMode, setIsSearchMode] = useState(false)

    // separate hook instance for confirmed searches (not the dropdown)
    const { results: searchResults, loading: srLoading, search: runSearch, clear: clearSearch } = useSearchWorkers()

    useGetCategories()
    useGetNearbyWorkers(filters)

    const update = (key, val) => setFilters(prev => ({ ...prev, [key]: val || undefined }))

    const handleCategoryClick = (catName) => {
        const match = dbCategories.find(c => c.name === catName)
        setFilters(prev => ({ ...prev, category: match?._id }))
        setIsSearchMode(false)
        setSearchQuery('')
        document.getElementById('workers-section')?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleBookNow = () => {
        if (!userData) navigate('/signin')
        else document.getElementById('workers-section')?.scrollIntoView({ behavior: 'smooth' })
    }

    // Called when user confirms a search (Enter / "Search" button / dropdown pick)
    const handleSearch = useCallback((q) => {
        setSearchQuery(q)
        setIsSearchMode(true)
        runSearch(q, mapState?.lat, mapState?.lng)
        document.getElementById('workers-section')?.scrollIntoView({ behavior: 'smooth' })
    }, [mapState, runSearch])

    const handleClearSearch = useCallback(() => {
        setSearchQuery('')
        setIsSearchMode(false)
        clearSearch()
    }, [clearSearch])

    return (
        <div className='w-full'>

            {/* ── MOBILE STICKY SEARCH (below header) ── */}
            <div className='md:hidden sticky top-[80px] z-[900] bg-[#fff9f6] px-4 pt-3 pb-2 border-b border-gray-100'>
                <SmartSearchBar onSearch={handleSearch} onClear={handleClearSearch} />
            </div>

            {/* ── MOBILE HERO ── */}
            <div className='md:hidden w-full bg-[#fff0eb] overflow-hidden relative'>
                <div className='px-5 pt-5 pb-0 relative z-10'>
                    <p className='text-xs font-semibold text-[#ff4d2d] uppercase tracking-wide mb-1'>Hire with confidence</p>
                    <h1 className='text-2xl font-extrabold text-gray-900 leading-tight'>
                        Trusted Professionals<br />
                        <span className='text-[#ff4d2d]'>At Your Service</span>
                    </h1>
                    <div className='mt-4 mb-3 inline-flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm'>
                        <FaStar className='text-yellow-400' size={14} />
                        <span className='font-bold text-gray-800 text-sm'>4.7</span>
                        <span className='text-xs text-gray-400'>Average Rating</span>
                    </div>
                </div>
                <img src={heroBg} alt='worker' className='w-[65%] ml-auto -mb-1 object-contain block' />
                <div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5'>
                    {[0,1,2].map(i => (
                        <span key={i} onClick={() => setActiveSlide(i)}
                            className={`h-2 rounded-full cursor-pointer transition-all ${i === activeSlide ? 'bg-[#ff4d2d] w-5' : 'w-2 bg-gray-300'}`} />
                    ))}
                </div>
            </div>

            {/* ── DESKTOP HERO ── */}
            <div className='hidden md:flex w-full max-w-7xl mx-auto px-6 pt-10 pb-10 gap-8 items-center'>
                <div className='flex-1'>
                    <p className='text-sm font-semibold text-[#ff4d2d] uppercase tracking-widest mb-3'>India's #1 Worker Platform</p>
                    <h1 className='text-5xl font-extrabold text-gray-900 leading-tight'>
                        Skilled Workers,<br />
                        <span className='text-[#ff4d2d]'>On Rent,</span> On Time.
                    </h1>
                    <p className='mt-4 text-lg text-gray-500 max-w-md'>Book verified and experienced workers for your everyday needs.</p>
                    <div className='flex items-center gap-2 mt-4 text-gray-600'>
                        <FaMapMarkerAlt className='text-[#ff4d2d]' />
                        <span className='font-medium'>{currentCity || 'Detecting location…'}</span>
                    </div>

                    {/* Desktop search bar inside hero */}
                    <div className='mt-6 max-w-xl'>
                        <SmartSearchBar onSearch={handleSearch} onClear={handleClearSearch} />
                    </div>

                    <div className='flex items-center gap-3 mt-5'>
                        <div className='flex -space-x-2'>
                            {['#ff9a8b','#ffa500','#4facfe'].map((c,i) => (
                                <div key={i} className='w-8 h-8 rounded-full border-2 border-white' style={{background:c}} />
                            ))}
                        </div>
                        <span className='text-sm text-gray-500'><span className='font-semibold text-gray-700'>10,000+</span> customers trust us</span>
                    </div>
                </div>

                {/* right: hero image */}
                <div className='relative flex-shrink-0 w-[400px] h-[400px]'>
                    <div className='absolute inset-0 bg-[#fff0eb] rounded-full' />
                    <img src={heroBg} alt='worker' className='absolute bottom-0 right-0 h-full object-contain z-10' />
                    <div className='absolute top-6 left-0 bg-white rounded-xl shadow-lg px-3 py-2 z-20 flex items-center gap-2'>
                        <div className='w-7 h-7 rounded-full bg-green-100 flex items-center justify-center'>
                            <FaShieldAlt size={13} className='text-green-600' />
                        </div>
                        <div>
                            <p className='text-xs font-bold text-gray-800'>Verified</p>
                            <p className='text-[10px] text-gray-400'>Background Checked</p>
                        </div>
                    </div>
                    <div className='absolute top-[40%] left-[-28px] bg-white rounded-xl shadow-lg px-3 py-2 z-20 flex items-center gap-2'>
                        <div className='w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center'>
                            <span className='text-blue-600 text-xs'>⏱</span>
                        </div>
                        <div>
                            <p className='text-xs font-bold text-gray-800'>On Time</p>
                            <p className='text-[10px] text-gray-400'>Punctual & Reliable</p>
                        </div>
                    </div>
                    <div className='absolute bottom-8 right-[-12px] bg-white rounded-xl shadow-lg px-3 py-2 z-20 flex items-center gap-2'>
                        <FaStar className='text-yellow-400' size={16} />
                        <div>
                            <p className='text-sm font-extrabold text-gray-800'>4.7 ★</p>
                            <p className='text-[10px] text-gray-400'>Average Rating</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── CATEGORIES ── */}
            <div className='w-full bg-white py-8'>
                <div className='max-w-7xl mx-auto px-4 md:px-6'>
                    <div className='flex items-center justify-between mb-5'>
                        <h2 className='text-xl md:text-2xl font-extrabold text-gray-900'>Popular Categories</h2>
                        <button className='text-sm text-[#ff4d2d] font-semibold'>View all →</button>
                    </div>
                    {/* Mobile circles */}
                    <div className='flex gap-4 overflow-x-auto pb-2 md:hidden -mx-4 px-4'>
                        {localCategories.slice(0, 8).map((c, i) => (
                            <button key={i} onClick={() => handleCategoryClick(c.category)}
                                className='flex flex-col items-center gap-2 shrink-0'>
                                <div className='w-[68px] h-[68px] rounded-full overflow-hidden border-2 border-[#ff4d2d]/20 shadow-md'>
                                    <img src={c.image} alt={c.category} className='w-full h-full object-cover' />
                                </div>
                                <span className='text-xs font-medium text-gray-700 whitespace-nowrap'>{c.category}</span>
                            </button>
                        ))}
                    </div>
                    {/* Desktop grid */}
                    <div className='hidden md:grid grid-cols-6 gap-4'>
                        {localCategories.slice(0, 6).map((c, i) => (
                            <button key={i} onClick={() => handleCategoryClick(c.category)}
                                className='flex flex-col rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all bg-white group'>
                                <div className='w-full h-[130px] overflow-hidden'
                                    style={{ background: ['#fff0eb','#fff8f0','#f0f9ff','#f0fff4','#fdf4ff','#fffbeb'][i] }}>
                                    <img src={c.image} alt={c.category}
                                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300' />
                                </div>
                                <div className='px-3 py-3 text-center'>
                                    <p className='font-bold text-gray-800 text-sm'>{c.category}</p>
                                    <p className='text-xs font-semibold text-[#ff4d2d] mt-1'>From ₹{CATEGORY_PRICES[c.category] || 99}/hr</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── MOBILE trust badges ── */}
            <div className='md:hidden flex justify-between px-4 py-4 bg-white border-t border-gray-50'>
                {[
                    { icon: '📅', title: 'Easy Booking', sub: 'Quick & Simple' },
                    { icon: '💰', title: 'Transparent', sub: 'Pricing' },
                    { icon: '✅', title: 'Verified', sub: 'Pros' },
                    { icon: '🎧', title: '24/7', sub: 'Support' },
                ].map((b, i) => (
                    <div key={i} className='flex flex-col items-center text-center gap-1'>
                        <span className='text-xl'>{b.icon}</span>
                        <p className='text-[10px] font-semibold text-gray-700'>{b.title}</p>
                        <p className='text-[9px] text-gray-400'>{b.sub}</p>
                    </div>
                ))}
            </div>

            {/* ── DESKTOP trust badges ── */}
            <div className='hidden md:block w-full bg-[#fff9f6] border-y border-[#ffe8e0]'>
                <div className='max-w-7xl mx-auto px-6 py-6 grid grid-cols-4 gap-6'>
                    {TRUST_BADGES.map((b, i) => {
                        const Icon = b.icon
                        return (
                            <div key={i} className='flex items-center gap-3'>
                                <div className={`w-10 h-10 rounded-xl ${b.bg} flex items-center justify-center shrink-0`}>
                                    <Icon size={18} className={b.color} />
                                </div>
                                <div>
                                    <p className='font-bold text-gray-800 text-sm'>{b.title}</p>
                                    <p className='text-xs text-gray-400'>{b.sub}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── WORKERS SECTION ── */}
            <div id='workers-section' className='w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10'>

                {/* Section header */}
                <div className='flex items-center justify-between mb-4 flex-wrap gap-2'>
                    <div>
                        <h2 className='text-xl md:text-2xl font-extrabold text-gray-900'>
                            {isSearchMode
                                ? <>Results for "<span className='text-[#ff4d2d]'>{searchQuery}</span>"</>
                                : <><span className='md:hidden'>Top Rated Workers</span>
                                   <span className='hidden md:inline'>Available Workers Near You</span></>
                            }
                        </h2>
                        {isSearchMode && (
                            <p className='text-sm text-gray-400 mt-0.5'>
                                {srLoading ? 'Searching…' : `${searchResults.length} worker${searchResults.length !== 1 ? 's' : ''} found`}
                            </p>
                        )}
                    </div>
                    <div className='flex items-center gap-3'>
                        {isSearchMode && (
                            <button onClick={handleClearSearch}
                                className='flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#ff4d2d] transition-colors'>
                                <FaTimes size={12} /> Clear search
                            </button>
                        )}
                        {!isSearchMode && (
                            <button className='text-sm text-[#ff4d2d] font-semibold'>View all →</button>
                        )}
                    </div>
                </div>

                {/* Desktop filters (hidden in search mode) */}
                {!isSearchMode && (
                    <div className='hidden md:flex gap-3 items-center mb-5 flex-wrap'>
                        <select className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#ff4d2d]'
                            value={filters.category || ''} onChange={e => update('category', e.target.value)}>
                            <option value=''>All Categories</option>
                            {dbCategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <select className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#ff4d2d]'
                            value={filters.minRating || ''} onChange={e => update('minRating', e.target.value)}>
                            <option value=''>Any Rating</option>
                            <option value='4'>4 ★ & above</option>
                            <option value='3'>3 ★ & above</option>
                        </select>
                        <select className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#ff4d2d]'
                            value={filters.radius || 10} onChange={e => update('radius', e.target.value)}>
                            {RADIUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <select className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:border-[#ff4d2d]'
                            value={filters.sort || 'distance'} onChange={e => update('sort', e.target.value)}>
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                )}

                {/* Worker list */}
                <div className='flex flex-col gap-3'>
                    {/* Search mode */}
                    {isSearchMode && srLoading && [...Array(3)].map((_, i) => <WorkerCardSkeleton key={i} />)}
                    {isSearchMode && !srLoading && searchResults.length === 0 && (
                        <div className='text-center py-14'>
                            <p className='text-4xl mb-3'>🔍</p>
                            <p className='font-semibold text-gray-700'>No workers found for "{searchQuery}"</p>
                            <p className='text-sm text-gray-400 mt-1 mb-5'>Try searching for:</p>
                            <div className='flex flex-wrap gap-2 justify-center'>
                                {['Driver', 'Maid', 'Electrician', 'Cook'].map(s => (
                                    <button key={s} onClick={() => handleSearch(s)}
                                        className='px-4 py-2 text-sm text-[#ff4d2d] border border-[#ff4d2d]/30 bg-[#fff0eb] rounded-full hover:bg-[#ff4d2d] hover:text-white transition-colors'>
                                        • {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {isSearchMode && !srLoading && searchResults.map((w, i) => (
                        <SearchWorkerCard key={w._id || i} worker={w} query={searchQuery} />
                    ))}

                    {/* Nearby mode */}
                    {!isSearchMode && searchLoading && [...Array(3)].map((_, i) => <WorkerCardSkeleton key={i} />)}
                    {!isSearchMode && !searchLoading && nearbyWorkers.length === 0 && (
                        <div className='text-center py-14'>
                            <p className='text-4xl mb-3'>📍</p>
                            <p className='font-semibold text-gray-600'>No workers found nearby</p>
                            <p className='text-sm text-gray-400 mt-1'>Try widening the radius or removing a filter</p>
                        </div>
                    )}
                    {!isSearchMode && !searchLoading && nearbyWorkers.map(w => (
                        <WorkerCard key={w._id} worker={w} />
                    ))}
                </div>
            </div>

            {/* ── BOTTOM CTA ── */}
            <div className='w-full max-w-7xl mx-auto px-4 md:px-6 pb-24 md:pb-10'>
                <div className='bg-[#fff0eb] rounded-2xl p-6 md:p-8 flex items-center justify-between gap-4 relative overflow-hidden'>
                    <div>
                        <h3 className='text-xl md:text-2xl font-extrabold text-gray-900'>Need a worker instantly?</h3>
                        <p className='text-gray-500 text-sm mt-1'>Get trusted help right at your doorstep.</p>
                        <button onClick={handleBookNow}
                            className='mt-4 inline-flex items-center gap-2 border-2 border-[#ff4d2d] text-[#ff4d2d] font-bold px-6 py-2.5 rounded-xl hover:bg-[#ff4d2d] hover:text-white transition-colors'>
                            Book Now →
                        </button>
                    </div>
                    <div className='text-5xl md:text-6xl md:opacity-20 select-none'>📍</div>
                </div>
            </div>

        </div>
    )
}
