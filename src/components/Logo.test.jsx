import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Logo } from './Logo';
import { WhitelabelConfig } from '../lib/whitelabel';

describe('Logo Component', () => {
    it('renders the company name text', () => {
        render(<Logo />);
        expect(screen.getByText(WhitelabelConfig.companyName)).toBeInTheDocument();
    });

    it('applies large size styling when size="large"', () => {
        const { container } = render(<Logo size="large" />);
        const div = container.firstChild;
        expect(div).toHaveClass('text-2xl');
    });

    it('applies default styling when no size prop', () => {
        const { container } = render(<Logo />);
        const div = container.firstChild;
        expect(div).toHaveClass('text-sm');
    });
});
