import React from 'react'

export default function HighlightText({ text = '', query = '' }) {
    if (!query?.trim()) return <span>{text}</span>
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
