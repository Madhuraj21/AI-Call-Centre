"use client";

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

interface Props extends ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children, ...props }: Props) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem storageKey="call-center-theme" {...props}>
      {children}
    </NextThemesProvider>
  )
}