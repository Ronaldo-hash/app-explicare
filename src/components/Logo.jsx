import React from 'react';
import { cn } from '../lib/utils';
import { useWhitelabel } from '../context/WhitelabelContext';

export const Logo = ({ size = "normal" }) => {
    const { company_name, logo_url } = useWhitelabel();

    // If there's a logo URL from the database, show the image
    if (logo_url) {
        return (
            <div className={cn(
                "flex items-center gap-2",
                size === "large" ? "gap-3" : ""
            )}>
                <img
                    src={logo_url}
                    alt={company_name}
                    className={cn(
                        "object-contain",
                        size === "large" ? "h-12" : size === "small" ? "h-6" : "h-8"
                    )}
                    onError={(e) => {
                        // If image fails to load, hide it and show text fallback
                        e.target.style.display = 'none';
                    }}
                />
            </div>
        );
    }

    // Text fallback
    return (
        <div className={cn(
            "text-activeBlue font-serif font-bold tracking-widest uppercase border border-activeBlue/30 px-3 py-1 rounded-sm text-sm",
            size === "large" ? "text-2xl px-6 py-3" : ""
        )}>
            {company_name}
        </div>
    );
};
