'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
  isExpanded: boolean
  toggleSidebar: () => void
  collapseSidebar: () => void
  expandSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  isExpanded: true,
  toggleSidebar: () => {},
  collapseSidebar: () => {},
  expandSidebar: () => {}
})

export const useSidebar = () => useContext(SidebarContext)

interface SidebarProviderProps {
  children: React.ReactNode
}

// Create a global variable to store the sidebar state
// This ensures the state persists across page navigations
let globalSidebarState: boolean | null = null;

export function SidebarProvider({ children }: SidebarProviderProps) {
  // Use a ref to track hydration status to avoid state updates during hydration
  const [hydrated, setHydrated] = useState(false)

  // Always start with expanded sidebar for server-side rendering and during hydration
  // This ensures server and client render the same content initially
  const [isExpanded, setIsExpanded] = useState<boolean>(true)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  // Mark component as hydrated (client-side only)
  useEffect(() => {
    // This runs after hydration is complete
    setHydrated(true)
  }, [])

  // Initialize state from localStorage or global variable after hydration
  useEffect(() => {
    // Skip during server-side rendering and hydration phase
    if (!hydrated) return

    // If we already have a global state, use it
    if (globalSidebarState !== null) {
      setIsExpanded(globalSidebarState)
      setIsInitialized(true)
      return
    }

    // Otherwise, try to get from localStorage
    try {
      const savedState = localStorage.getItem('sidebarExpanded')
      if (savedState !== null) {
        const parsedState = savedState === 'true'
        setIsExpanded(parsedState)
        globalSidebarState = parsedState
      } else {
        globalSidebarState = true
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error)
      globalSidebarState = true
    }

    setIsInitialized(true)
  }, [hydrated])

  // Save state to localStorage and global variable whenever it changes
  // But only after initialization to avoid overwriting with default value
  useEffect(() => {
    if (!hydrated || !isInitialized) return

    try {
      localStorage.setItem('sidebarExpanded', isExpanded.toString())
      globalSidebarState = isExpanded
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  }, [isExpanded, isInitialized, hydrated])

  const toggleSidebar = () => {
    if (!hydrated) return
    setIsExpanded(prev => !prev)
  }

  const collapseSidebar = () => {
    if (!hydrated) return
    setIsExpanded(false)
  }

  const expandSidebar = () => {
    if (!hydrated) return
    setIsExpanded(true)
  }

  return (
    <SidebarContext.Provider value={{
      isExpanded,
      toggleSidebar,
      collapseSidebar,
      expandSidebar
    }}>
      {children}
    </SidebarContext.Provider>
  )
}
