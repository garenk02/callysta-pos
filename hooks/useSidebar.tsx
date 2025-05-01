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
  // Always start with expanded sidebar for server-side rendering
  // to avoid hydration mismatch
  const [isExpanded, setIsExpanded] = useState<boolean>(true)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)
  const [isMounted, setIsMounted] = useState<boolean>(false)

  // First mark component as mounted (client-side only)
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Initialize state from localStorage or global variable on mount
  useEffect(() => {
    if (!isMounted) return

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
  }, [isMounted])

  // Save state to localStorage and global variable whenever it changes
  // But only after initialization to avoid overwriting with default value
  useEffect(() => {
    if (!isMounted || !isInitialized) return

    try {
      localStorage.setItem('sidebarExpanded', isExpanded.toString())
      globalSidebarState = isExpanded
    } catch (error) {
      console.error('Error writing to localStorage:', error)
    }
  }, [isExpanded, isInitialized, isMounted])

  const toggleSidebar = () => {
    if (!isMounted) return
    setIsExpanded(prev => !prev)
  }

  const collapseSidebar = () => {
    if (!isMounted) return
    setIsExpanded(false)
  }

  const expandSidebar = () => {
    if (!isMounted) return
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
