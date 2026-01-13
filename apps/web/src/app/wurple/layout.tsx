import type { Metadata } from 'next'
import WurpleHeader from './components/WurpleHeader'
import WurpleFooter from './components/WurpleFooter'

export const metadata: Metadata = {
    title: 'Wurple',
    description: 'Wurple game',
}

export default function WurpleLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="wurple-layout">
            <WurpleHeader />
            {children}
            <WurpleFooter />
        </div>
    )
}