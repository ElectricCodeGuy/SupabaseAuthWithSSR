'use client';
import React from 'react';
import {
  Button,
  Box,
  Typography,
  TextareaAutosize,
  Collapse,
  Select,
  MenuItem,
  Paper,
  styled
} from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';
import { SelectChangeEvent } from '@mui/material/Select';
import { logFeedback } from './action';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onCatch?: (error: Error, info: React.ErrorInfo) => void;
  logger?: (error: Error, errorInfo: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  feedback: string;
  feedbackCategory: string;
  showDetails: boolean;
}

const StyledErrorBox = styled(Paper)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  margin: 'auto',
  padding: '20px'
});

class GeneralErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    feedback: '',
    feedbackCategory: 'ui',
    showDetails: false
  };

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ hasError: true, error, errorInfo });
    this.props.onCatch?.(error, errorInfo);
    if (this.props.logger && errorInfo.componentStack) {
      this.props.logger(error, errorInfo.componentStack);
    }
  }

  public handleFeedbackChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    this.setState({ feedback: e.target.value });
  };

  public handleFeedbackCategoryChange = (
    event: SelectChangeEvent<string> // Corrected type
  ): void => {
    this.setState({ feedbackCategory: event.target.value as string });
  };

  public toggleDetails = (): void => {
    this.setState((prevState) => ({ showDetails: !prevState.showDetails }));
  };

  public retry = (): void => {
    window.location.reload();
  };

  public render(): React.ReactNode {
    const { children } = this.props;
    const {
      hasError,
      showDetails,
      feedback,
      feedbackCategory,
      error,
      errorInfo
    } = this.state;

    if (!hasError) {
      return children;
    }

    return (
      <StyledErrorBox elevation={3}>
        <ErrorIcon fontSize="large" color="error" />
        <Typography variant="h4" gutterBottom>
          Oops! Something went wrong.
        </Typography>
        <Button variant="outlined" onClick={this.toggleDetails}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
        <Collapse in={showDetails}>
          <Typography variant="body2" gutterBottom>
            Error: {error?.message}
          </Typography>
          <Typography variant="body2">
            {errorInfo && <pre>{errorInfo.componentStack}</pre>}
          </Typography>
        </Collapse>
        <form action={logFeedback}>
          <Box
            sx={{
              my: 2
            }}
          >
            <Select
              value={feedbackCategory}
              onChange={this.handleFeedbackCategoryChange}
              fullWidth
            >
              <MenuItem value="ui">UI Issue</MenuItem>
              <MenuItem value="functionality">Functionality Error</MenuItem>
              <MenuItem value="performance">Performance Issue</MenuItem>
            </Select>
          </Box>
          <Box
            sx={{
              my: 2
            }}
          >
            <TextareaAutosize
              value={feedback}
              onChange={this.handleFeedbackChange}
              placeholder="Describe the issue..."
              minRows={3}
            />
          </Box>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Submit Feedback
          </Button>
        </form>
        <Box
          sx={{
            mt: 2
          }}
        >
          <Button
            variant="contained"
            color="secondary"
            onClick={this.retry}
            fullWidth
          >
            Retry
          </Button>
        </Box>
      </StyledErrorBox>
    );
  }
}

export default GeneralErrorBoundary;
