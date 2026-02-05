import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { WhitelabelConfig } from '../lib/whitelabel';

export const Logo = ({ size = "normal" }) => {
    const [error] = useState(false);

    if (error) {
        return (
            <div className={cn("text-white font-serif font-bold tracking-widest uppercase border-2 border-activeBlue px-4 py-2 rounded-sm",
                size === "large" ? "text-3xl" : size === "small" ? "text-sm" : "text-xl"
            )}>
                {WhitelabelConfig.companyName}
            </div>
        );
    }

    // White label: Return generic text if no logo path, or just a placeholder
    return (
        <div className={cn("text-activeBlue font-serif font-bold tracking-widest uppercase border border-activeBlue/30 px-3 py-1 rounded-sm text-sm",
            size === "large" ? "text-2xl px-6 py-3" : ""
        )}>
            {WhitelabelConfig.companyName}
        </div>
    );
};
