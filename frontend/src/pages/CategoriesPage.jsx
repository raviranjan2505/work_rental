import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FaSearch, FaTimes, FaArrowLeft, FaUsers, FaChevronRight } from 'react-icons/fa'
import { MdVerified } from 'react-icons/md'
import useGetCategories from '../hooks/useGetCategories'
import { categories as localCategories } from '../category'

// ── price hints per category ──────────────────────────────────────────────────
const PRICES = {
    Driver: 99, Cook: 149, Maid: 99, Sweeper: 89, Electrician: 149,
    Plumber: 149, Carpenter: 129, 'AC Technician': 199, Labour: 89,
    Painter: 129, Welder: 149, Gardener: 99, 'Security Guard': 119,
    'Office Boy': 89, 'Personal Assistant': 199, 'Bank Work Assistant': 149,
    'Delivery Boy': 79, 'Parcel Runner': 79,
}

// ── short taglines per category ───────────────────────────────────────────────
const TAGS = {
    Driver: 'On-time & reliable',
    Cook: 'Delicious & hygienic',
    Maid: 'Cleaning & household',
    Sweeper: 'Clean & neat',
    Electrician: 'Wiring & repairs',
    Plumber: 'Pipe & fittings',
    Carpenter: 'Furniture & woodwork',
    'AC Technician': 'AC install & service',
    Labour: 'Heavy work & loading',
    Painter: 'Walls & surfaces',
    Welder: 'Metal fabrication',
    Gardener: 'Plants & landscaping',
    'Security Guard': 'Safety & surveillance',
    'Office Boy': 'Office assistance',
    'Personal Assistant': 'Admin & errands',
    'Bank Work Assistant': 'Banking & docs',
    'Delivery Boy': 'Fast deliveries',
    'Parcel Runner': 'Package handling',
}

// ── accent colour per group ───────────────────────────────────────────────────
const GROUP_META = {
    'Home Services':      { color: 'bg-orange-50 text-orange-600',  dot: 'bg-orange-400',  emoji: '🏠' },
    'Technical Services': { color: 'bg-blue-50 text-blue-600',      dot: 'bg-blue-400',    emoji: '⚡' },
    'Labour Services':    { color: 'bg-green-50 text-green-600',    dot: 'bg-green-400',   emoji: '💪' },
    'Assistant Services': { color: 'bg-purple-50 text-purple-600',  dot: 'bg-purple-400',  emoji: '🤝' },
    'Delivery Services':  { color: 'bg-yellow-50 text-yellow-600',  dot: 'bg-yellow-400',  emoji: '📦' },
}

const ALL_GROUPS = ['All', ...Object.keys(GROUP_META)]

// card bg tints to cycle through
const CARD_BGTINTS = [
    '#fff0eb', '#fff8f0', '#f0f9ff', '#f0fff4',
    '#fdf4ff', '#fffbeb', '#f0f9ff', '#fef9ec',
]

export default function CategoriesPage() {
    const navigate = useNavigate()
    const { categories: dbCategories } = useSelector(state => state.worker)
    useGetCategories()

    const [activeGroup, setActiveGroup] = useState('All')
    const [search, setSearch] = useState('')

    // merge local (images) with db (ids) by name
    const merged = useMemo(() => {
        return localCategories.map((lc, idx) => {
            const db = dbCategories.find(d => d.name === lc.category)
            return {
                name: lc.category,
                group: lc.group,
                image: lc.image,
                dbId: db?._id || null,
                price: PRICES[lc.category] || 99,
                tagline: TAGS[lc.category] || 'Professional service',
                tint: CARD_BGTINTS[idx % CARD_BGTINTS.length],
            }
        })
    }, [dbCategories])

    // filter
    const filtered = useMemo(() => {
        return merged.filter(c => {
            const groupOk = activeGroup === 'All' || c.group === activeGroup
            const searchOk = !search.trim() ||
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.tagline.toLowerCase().includes(search.toLowerCase())
            return groupOk && searchOk
        })
    }, [merged, activeGroup, search])

    // group sections (only used when "All" tab active + no search)
    const sections = useMemo(() => {
        if (activeGroup !== 'All' || search.trim()) return null
        const map = {}
        filtered.forEach(c => {
            if (!map[c.group]) map[c.group] = []
            map[c.group].push(c)
        })
        return Object.entries(map)
    }, [filtered, activeGroup, search])

    const handleFind = (cat) => {
        if (cat.dbId) navigate(`/workers?category=${cat.dbId}`)
        else navigate(`/?q=${encodeURIComponent(cat.name)}`)
    }

    const CategoryCard = ({ cat, size = 'normal' }) => {
        const gm = GROUP_META[cat.group] || GROUP_META['Home Services']
        return (
            <div
                onClick={() => handleFind(cat)}
                className={`group relative bg-white rounded-2xl border border-gray-100 shadow-sm
                    hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col`}
            >
                {/* image */}
                <div
                    className={`w-full overflow-hidden shrink-0 ${size === 'small' ? 'h-[100px]' : 'h-[140px] md:h-[160px]'}`}
                    style={{ background: cat.tint }}
                >
                    <img
                        src={cat.image} alt={cat.name}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                    />
                </div>

                {/* body */}
                <div className={`flex flex-col flex-1 ${size === 'small' ? 'p-2.5' : 'p-4'}`}>
                    {/* group badge */}
                    <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 ${gm.color}`}>
                        {gm.emoji} {cat.group.replace(' Services', '')}
                    </span>

                    <p className={`font-extrabold text-gray-800 leading-tight ${size === 'small' ? 'text-sm' : 'text-base'}`}>
                        {cat.name}
                    </p>
                    <p className={`text-gray-400 mt-0.5 leading-tight ${size === 'small' ? 'text-[10px]' : 'text-xs'}`}>
                        {cat.tagline}
                    </p>

                    <div className={`mt-auto flex items-center justify-between ${size === 'small' ? 'pt-2' : 'pt-3'}`}>
                        <p className={`font-bold text-[#ff4d2d] ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
                            From ₹{cat.price}/hr
                        </p>
                        {size !== 'small' && (
                            <button className='flex items-center gap-1 text-xs font-semibold text-[#ff4d2d] bg-[#fff0eb]
                                px-3 py-1.5 rounded-full group-hover:bg-[#ff4d2d] group-hover:text-white transition-colors'>
                                Find Workers <FaChevronRight size={9} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='w-full min-h-screen bg-[#fff9f6] pt-[80px] pb-24 md:pb-10'>

            {/* ── PAGE HEADER ── */}
            <div className='w-full bg-white border-b border-gray-100 sticky top-[80px] z-[800]'>
                <div className='max-w-7xl mx-auto px-4 md:px-6'>

                    {/* title row */}
                    <div className='flex items-center gap-3 py-4 md:py-5'>
                        <button
                            onClick={() => navigate(-1)}
                            className='p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors'
                        >
                            <FaArrowLeft size={16} />
                        </button>
                        <div>
                            <h1 className='text-xl md:text-2xl font-extrabold text-gray-900'>All Categories</h1>
                            <p className='text-xs text-gray-400 hidden md:block mt-0.5'>
                                {merged.length} service categories available
                            </p>
                        </div>
                    </div>

                    {/* search bar */}
                    <div className='pb-3 md:pb-4'>
                        <div className={`flex items-center bg-gray-50 border-2 rounded-2xl px-4 gap-3 transition-colors
                            ${search ? 'border-[#ff4d2d]' : 'border-transparent focus-within:border-[#ff4d2d]'}`}>
                            <FaSearch size={14} className='text-gray-400 shrink-0' />
                            <input
                                type='text'
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder='Search categories or services…'
                                className='flex-1 py-3 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400'
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className='text-gray-400 hover:text-gray-600'>
                                    <FaTimes size={13} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* group filter tabs */}
                    <div className='flex gap-2 overflow-x-auto pb-3 md:pb-4 scrollbar-hide -mx-1 px-1'>
                        {ALL_GROUPS.map(g => {
                            const gm = GROUP_META[g]
                            const active = activeGroup === g
                            return (
                                <button
                                    key={g}
                                    onClick={() => setActiveGroup(g)}
                                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border
                                        ${active
                                            ? 'bg-[#ff4d2d] text-white border-[#ff4d2d] shadow-md shadow-[#ff4d2d]/20'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-[#ff4d2d] hover:text-[#ff4d2d]'
                                        }`}
                                >
                                    {gm && <span>{gm.emoji}</span>}
                                    <span>{g === 'All' ? '✦ All' : g.replace(' Services', '')}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div className='max-w-7xl mx-auto px-4 md:px-6 py-6'>

                {/* no results */}
                {filtered.length === 0 && (
                    <div className='text-center py-20'>
                        <p className='text-5xl mb-4'>🔍</p>
                        <p className='text-lg font-bold text-gray-700'>No categories found</p>
                        <p className='text-sm text-gray-400 mt-1'>Try a different search or group</p>
                        <button onClick={() => { setSearch(''); setActiveGroup('All') }}
                            className='mt-4 px-5 py-2 bg-[#ff4d2d] text-white rounded-full text-sm font-semibold'>
                            Reset filters
                        </button>
                    </div>
                )}

                {/* ── GROUPED VIEW (All tab, no search) ── */}
                {sections && filtered.length > 0 && (
                    <div className='flex flex-col gap-10'>
                        {sections.map(([group, cats]) => {
                            const gm = GROUP_META[group] || GROUP_META['Home Services']
                            return (
                                <section key={group}>
                                    {/* section header */}
                                    <div className='flex items-center gap-3 mb-4'>
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base
                                            ${gm.color.split(' ')[0]}`}>
                                            {gm.emoji}
                                        </div>
                                        <div>
                                            <h2 className='text-lg font-extrabold text-gray-800'>{group}</h2>
                                            <p className='text-xs text-gray-400'>{cats.length} categories</p>
                                        </div>
                                        <div className='flex-1 h-px bg-gray-100 ml-2' />
                                        <button
                                            onClick={() => setActiveGroup(group)}
                                            className='text-xs text-[#ff4d2d] font-semibold hover:underline shrink-0'>
                                            View all →
                                        </button>
                                    </div>

                                    {/* Desktop: 4-col grid */}
                                    <div className='hidden md:grid grid-cols-4 gap-5'>
                                        {cats.map((cat, i) => <CategoryCard key={i} cat={cat} />)}
                                    </div>

                                    {/* Mobile: 2-col grid */}
                                    <div className='grid grid-cols-2 gap-3 md:hidden'>
                                        {cats.map((cat, i) => <CategoryCard key={i} cat={cat} size='small' />)}
                                    </div>
                                </section>
                            )
                        })}
                    </div>
                )}

                {/* ── FLAT GRID VIEW (filtered / search active) ── */}
                {!sections && filtered.length > 0 && (
                    <>
                        {/* result count */}
                        <p className='text-sm text-gray-500 mb-4'>
                            {filtered.length} {filtered.length === 1 ? 'category' : 'categories'}
                            {activeGroup !== 'All' && <> in <span className='font-semibold text-gray-700'>{activeGroup}</span></>}
                            {search && <> matching "<span className='font-semibold text-gray-700'>{search}</span>"</>}
                        </p>

                        {/* Desktop: 4-col grid */}
                        <div className='hidden md:grid grid-cols-4 gap-5'>
                            {filtered.map((cat, i) => <CategoryCard key={i} cat={cat} />)}
                        </div>

                        {/* Mobile: 2-col grid */}
                        <div className='grid grid-cols-2 gap-3 md:hidden'>
                            {filtered.map((cat, i) => <CategoryCard key={i} cat={cat} size='small' />)}
                        </div>
                    </>
                )}

                {/* ── DESKTOP: stats banner at bottom ── */}
                {filtered.length > 0 && (
                    <div className='hidden md:grid grid-cols-4 gap-4 mt-12 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm'>
                        {[
                            { icon: '🏆', val: '18+', label: 'Service Categories' },
                            { icon: '✅', val: '500+', label: 'Verified Workers' },
                            { icon: '⭐', val: '4.7', label: 'Average Rating' },
                            { icon: '🎯', val: '10K+', label: 'Happy Customers' },
                        ].map((s, i) => (
                            <div key={i} className='text-center'>
                                <p className='text-3xl mb-1'>{s.icon}</p>
                                <p className='text-2xl font-extrabold text-gray-800'>{s.val}</p>
                                <p className='text-sm text-gray-400'>{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
