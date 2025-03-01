'use client';

import type { ReactNode } from 'react';
import React, { Component } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  isReloading: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isReloading: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true, isReloading: false };
  }

  handleReload = () => {
    this.setState({ isReloading: true });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col justify-center items-center h-[90vh] p-2 sm:p-4 md:p-6 lg:p-8 text-center">
          <h1 className="text-3xl font-bold mb-4">
            Sorry - something went wrong
          </h1>
          <p className="mb-4 text-gray-700">
            If you are using Google Translate, it may crash the page. Please
            disable it.
          </p>

          <Button onClick={this.handleReload} disabled={this.state.isReloading}>
            Reload the page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
