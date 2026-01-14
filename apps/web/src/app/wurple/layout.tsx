import type { Metadata } from 'next'
import WurpleHeader from './components/WurpleHeader'
import WurpleFooter from './components/WurpleFooter'
import GameBar from '../appComponents/GameBar'

export const metadata: Metadata = {
    title: 'Wurple',
    description: 'A daily color-logic puzzle',
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
}

export default function WurpleLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="wurple-layout">
            {children}
        </div>
    )
}