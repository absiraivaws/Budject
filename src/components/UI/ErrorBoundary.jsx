import React from 'react';
import Card from './Card.jsx';
import Button from './Button.jsx';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="p-4 flex justify-center items-center min-h-[50vh]">
                    <Card title="Something went wrong" className="max-w-md w-full border-danger">
                        <div className="text-center">
                            <div className="text-4xl mb-4">😕</div>
                            <p className="text-text-secondary mb-4">
                                We encountered an unexpected error while loading this section.
                            </p>

                            {this.state.error && (
                                <div className="bg-bg-tertiary p-3 rounded-md text-left text-xs font-mono mb-4 overflow-auto max-h-32 text-danger">
                                    {this.state.error.toString()}
                                </div>
                            )}

                            <div className="flex justify-center gap-2">
                                <Button variant="secondary" onClick={() => window.location.href = '/'}>
                                    Go Home
                                </Button>
                                <Button variant="primary" onClick={this.handleReset}>
                                    Reload Page
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
