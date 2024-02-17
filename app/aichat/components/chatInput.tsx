import React, { useRef } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface ChatInputFieldProps {
  input: string;
  isLoading: boolean;
  stop: () => void;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleIconClick: () => void;
  handleKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  handleReload: () => void;
  selectedPrompt: string; // New prop for the selected prompt option
  setSelectedPrompt: React.Dispatch<React.SetStateAction<string>>;
  messageCount: number;
}
const StyledChatPaper = styled(Paper)({
  position: 'fixed',
  bottom: '10px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '50%', // Adjust width if needed
  zIndex: 1000,
  backgroundColor: 'lightgray',
  padding: '2px', // Reduced padding for better spacing
  borderRadius: '20px'
});

const aiModels = [
  'gpt-3.5-turbo-1106',
  'gpt-3.5-turbo-16k',
  'gpt-4-0125-preview',
  'gpt-4-1106-preview',
  'gpt-4'
];
const promptOptions = ['general', 'technical', 'travel']; // Define prompt options

const ChatInputField: React.FC<ChatInputFieldProps> = ({
  input,
  isLoading,
  stop,
  handleInputChange,
  handleIconClick,
  handleKeyDown,
  selectedModel,
  setSelectedModel,
  handleReload,
  selectedPrompt,
  setSelectedPrompt,
  messageCount
}) => {
  const textFieldRef = useRef<HTMLInputElement | null>(null); // Specify the type of the ref
  const modelTypes = ['openai', 'perplex']; // Define model types
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const modelType = searchParams.get('modelType') || 'openai'; // Default to 'openai'

  // Handler for model type change
  const handleModelTypeChange = (
    event: React.SyntheticEvent,
    newValue: string | null
  ) => {
    const newSearchParams = new URLSearchParams(window.location.search);
    newSearchParams.set('modelType', newValue || 'openai');
    router.replace(`${pathname}?${newSearchParams.toString()}`, {
      scroll: false
    });
  };

  return (
    <StyledChatPaper elevation={4}>
      <TextField
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        variant="outlined"
        multiline
        maxRows={6}
        disabled={isLoading}
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                color="primary"
                onClick={isLoading ? stop : handleIconClick}
                disabled={isLoading}
              >
                {isLoading ? <CloseIcon /> : <SendIcon />}
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{
          '.MuiOutlinedInput-root': {
            backgroundColor: 'white',
            borderRadius: '20px'
          }
        }}
        inputRef={textFieldRef}
        placeholder="Type your message..."
      />

      <Grid container spacing={1} justifyContent="center">
        <Grid item xs={12} sm={2}>
          {handleReload && messageCount > 0 && (
            <Box sx={{ textAlign: 'center', my: 2 }}>
              <Button
                onClick={handleReload}
                disabled={isLoading}
                variant="contained"
                color="primary"
              >
                Reload
              </Button>
            </Box>
          )}
        </Grid>
        {modelType === 'openai' && (
          <Grid item xs={12} sm={3}>
            <Autocomplete
              options={aiModels}
              value={selectedModel}
              onChange={(
                event: React.SyntheticEvent,
                newValue: string | null
              ) => {
                setSelectedModel(newValue || '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="AI Model"
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    style: { borderRadius: 20, backgroundColor: 'white' }
                  }}
                />
              )}
              sx={{
                width: '100%',
                '.MuiAutocomplete-root .MuiOutlinedInput-root': {
                  padding: '8px',
                  '.MuiInputBase-input': {
                    padding: '10px 14px'
                  }
                }
              }}
              disableClearable
            />
          </Grid>
        )}

        <Grid item xs={12} sm={3}>
          <Autocomplete
            options={promptOptions}
            value={selectedPrompt}
            onChange={(
              event: React.SyntheticEvent,
              newValue: string | null
            ) => {
              setSelectedPrompt(newValue || 'general');
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Prompt Type"
                margin="normal"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  style: { borderRadius: 20, backgroundColor: 'white' }
                }}
              />
            )}
            sx={{
              width: '100%',
              '.MuiAutocomplete-root .MuiOutlinedInput-root': {
                padding: '8px',
                '.MuiInputBase-input': {
                  padding: '10px 14px'
                }
              }
            }}
            disableClearable
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <Autocomplete
            options={modelTypes}
            value={modelType}
            onChange={handleModelTypeChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Model Type"
                margin="normal"
                variant="outlined"
                InputProps={{
                  ...params.InputProps,
                  style: { borderRadius: 20, backgroundColor: 'white' }
                }}
              />
            )}
            sx={{
              width: '100%',
              '.MuiAutocomplete-root .MuiOutlinedInput-root': {
                padding: '8px',
                '.MuiInputBase-input': {
                  padding: '10px 14px'
                }
              }
            }}
            disableClearable
          />
        </Grid>
      </Grid>
    </StyledChatPaper>
  );
};

export default ChatInputField;
