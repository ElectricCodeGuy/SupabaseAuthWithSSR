'use client';
import type { ReactNode, ErrorInfo } from 'react';
import React, { Component } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  onCatch?: (_error: Error, _info: ErrorInfo) => void;
  logger?: (_error: Error, _errorInfo: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class GeneralErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public navigateToRoot = () => {
    window.location.href = '/';
  };

  public render(): ReactNode {
    const { children } = this.props;
    const { hasError, error, errorInfo } = this.state;

    if (!hasError) {
      return children;
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 44px)',
          margin: 'auto',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ color: 'red', fontSize: '48px', marginBottom: '20px' }}>
          ⚠️
        </div>
        <h1 style={{ margin: '0 0 20px 0', fontSize: '24px' }}>
          Ups! Something went wrong
        </h1>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
          Error: {error?.message}
        </p>
        {errorInfo && (
          <pre
            style={{
              margin: '0 0 20px 0',
              fontSize: '12px',
              maxWidth: '100%',
              overflow: 'auto'
            }}
          >
            {errorInfo.componentStack}
          </pre>
        )}
        <button
          onClick={this.navigateToRoot}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%',
            maxWidth: '200px'
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.backgroundColor = '#0056b3')
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.backgroundColor = '#007bff')
          }
        >
          Back to Home
        </button>
      </div>
    );
  }
}

export default GeneralErrorBoundary;
