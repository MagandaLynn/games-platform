import React from 'react';

export default function WurpleFooter() {
    return (
        <footer className="mt-8 py-4 text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Wurple. All rights reserved.</p>
        </footer>
    );
}