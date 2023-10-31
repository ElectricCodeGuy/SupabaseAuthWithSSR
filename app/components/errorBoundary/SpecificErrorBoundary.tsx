'use client';
import React from 'react';
import { SelectChangeEvent } from '@mui/material';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import Collapse from '@mui/material/Collapse';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ErrorIcon from '@mui/icons-material/Error';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onCatch?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  feedback: string;
  feedbackCategory: string;
  showDetails: boolean;
}

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

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ hasError: true, error, errorInfo });
    this.props.onCatch?.(error, errorInfo);
  }

  public handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.setState({ feedback: e.target.value });
  };

  public handleFeedbackCategoryChange = (e: SelectChangeEvent<string>) => {
    this.setState({ feedbackCategory: e.target.value });
  };

  public submitFeedback = () => {
    const { feedback, feedbackCategory } = this.state;
    console.log(`User Feedback: ${feedback}, Category: ${feedbackCategory}`);
    alert('Thank you for your feedback!');
    this.setState({ feedback: '' });
  };

  public toggleDetails = () => {
    this.setState((prevState) => ({ showDetails: !prevState.showDetails }));
  };

  public retry = () => {
    window.location.reload();
  };

  public render() {
    const { children } = this.props;
    const { hasError, showDetails, feedback, feedbackCategory, error } =
      this.state;

    if (!hasError) {
      return children;
    }

    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <ErrorIcon fontSize="large" color="error" />
        <Typography variant="h4" gutterBottom>
          An unexpected error occurred. Please try again later.
        </Typography>
        <Button variant="outlined" onClick={this.toggleDetails}>
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
        <Collapse in={showDetails}>
          <Typography variant="body2" gutterBottom>
            {error?.message}
          </Typography>
        </Collapse>
        <Box my={2}>
          <Select
            value={feedbackCategory}
            onChange={this.handleFeedbackCategoryChange}
            fullWidth
          >
            <MenuItem value="ui">UI Issue</MenuItem>
            <MenuItem value="functionality">Functionality Broken</MenuItem>
            <MenuItem value="performance">Performance Issue</MenuItem>
          </Select>
        </Box>
        <Box my={2}>
          <TextareaAutosize
            value={feedback}
            onChange={this.handleFeedbackChange}
            placeholder="Leave feedback about the error..."
            minRows={3}
          />
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={this.submitFeedback}
          fullWidth
        >
          Submit Feedback
        </Button>
        <Box mt={2}>
          <Button
            variant="contained"
            color="secondary"
            onClick={this.retry}
            fullWidth
          >
            Retry
          </Button>
        </Box>
      </Box>
    );
  }
}

export default GeneralErrorBoundary;
