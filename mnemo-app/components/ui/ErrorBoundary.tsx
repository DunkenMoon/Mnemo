"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertCircle, RotateCcw } from "lucide-react"

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[300px] bg-[#0A0A1F]/80 backdrop-blur-md rounded-2xl border border-[#1E1E3F] p-8">
          <AlertCircle size={48} className="text-[#FF6B6B] mb-4" />
          <h2 className="text-[#F0F0FF] text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-[#8888AA] text-center max-w-md mb-6">
            {this.state.error?.message || "An unexpected error occurred while rendering this component."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="flex items-center gap-2 bg-[#1E1E3F] hover:bg-[#2A2A4A] text-[#F0F0FF] px-4 py-2 rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
