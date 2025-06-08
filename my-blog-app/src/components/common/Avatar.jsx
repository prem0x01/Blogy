import React, { useMemo } from 'react';

const getColorFromName = (name) => {
    const colors = [
        'bg-red-500',
        'bg-green-500',
        'bg-blue-500',
        'bg-yellow-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-orange-500',
        'bg-emerald-500',
        'bg-indigo-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

// Get initials from username
const getInitials = (name = 'User') => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};


const Avatar = ({ src, alt = 'User', name = 'User', className = '' }) => {
    const bgColor = getColorFromName(name);
    const initials = getInitials(name);

    return src ? (
        <img
            src={src}
            alt={alt}
            className={`rounded-full object-cover ${className}`}
        />
    ) : (
        <div
            className={`rounded-full flex items-center justify-center text-white font-bold select-none ${bgColor} ${className}`}
            title={name}
        >
            {initials}
        </div>
    );
};

export default Avatar;
