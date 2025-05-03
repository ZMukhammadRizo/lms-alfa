import React, { createContext, useContext, useState } from 'react'

type TabContextType = {
	activeIndex: number
	setActiveIndex: (i: number) => void
}

const TabContext = createContext<TabContextType | undefined>(undefined)

export const TabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [activeIndex, setActiveIndex] = useState(0)
	return (
		<TabContext.Provider value={{ activeIndex, setActiveIndex }}>{children}</TabContext.Provider>
	)
}

export const useTab = () => {
	const ctx = useContext(TabContext)
	if (!ctx) throw new Error('useTab must be used inside TabProvider')
	return ctx
}
