import {goto} from '$app/navigation';
import {deserialize} from '$app/forms';
import {toast} from 'svelte-sonner';
import type {SuperValidated} from 'sveltekit-superforms';
import {superForm} from 'sveltekit-superforms/client';
import {writable, type Writable} from 'svelte/store';
import {
    type ApiErrorResponse,
    type ApiSuccessResponse,
    createErrorResponse,
    createSuccessResponse
} from '$lib/types/api';
export type { ApiErrorResponse };

/**
 * Helper function to parse complex JSON error structures
 * This handles the case where the server returns a stringified JSON array
 * that contains error information
 */
function parseComplexErrorResponse(data: string): ApiErrorResponse | null {
  try {
    // Try to parse the string as JSON
    const parsed = JSON.parse(data);
    
    // If we have an array, try to extract the error message
    if (Array.isArray(parsed)) {
      // Look for objects in the array that have type/text properties
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        
        // Check if this looks like an error message object
        if (item && typeof item === 'object' && 'type' in item && item.type === 'error' && 'text' in item) {
          // Found an error message object
          return createErrorResponse(
            item.text || 'An error occurred',
            item.code || 'ERROR',
            item.details
          ) as ApiErrorResponse;
        }
      }
      
      // If we didn't find a direct error object, look for indices that might contain error data
      // This handles the case where the array contains indices to other elements
      const messageIndex = parsed.findIndex(item => 
        item && typeof item === 'object' && 'type' in item && 'text' in item);
      
      if (messageIndex >= 0) {
        const message = parsed[messageIndex];
        const details = message.details !== undefined && message.details !== -1 ? 
          (typeof parsed[message.details] === 'string' ? parsed[message.details] : message.details) : undefined;
        const code = message.code !== undefined && message.code !== -1 ? 
          (typeof parsed[message.code] === 'string' ? parsed[message.code] : message.code) : 'ERROR';
        
        return createErrorResponse(
          message.text || 'An error occurred',
          code,
          details
        ) as ApiErrorResponse;
      }
    }
  } catch {
    // Ignore parse errors
  }
  
  return null;
}

export type FormHandlerOptions = {
    // Navigation options
    successRedirect?: string;
    // Form behavior options
    validateOnInput?: boolean;
    delayMs?: number;
    timeoutMs?: number;
    debugMode?: boolean;
    dataType?: 'json' | 'form';
    // Callbacks
    onSuccess?: (result: any) => void | ApiSuccessResponse;
    onError?: (error: any) => void | ApiErrorResponse;
    // Message handling
    errorMessageStore?: Writable<ApiErrorResponse | null>;
    successMessageStore?: Writable<ApiSuccessResponse | null>;
};

/**
 * Creates a superForm instance with standardized error handling and validation
 * 
 * @param formData The validated form data from the server
 * @param options Configuration options for the form handler
 * @returns A configured superForm instance and an error message store
 */
export function createFormHandler<T extends Record<string, unknown>>(
    formData: SuperValidated<T>,
    options: FormHandlerOptions = {}
) {
    // Create or use provided message stores
    const errorMessage = options.errorMessageStore || writable<ApiErrorResponse | null>(null);
    const successMessage = options.successMessageStore || writable<ApiSuccessResponse | null>(null);
    
    // Default options
    const {
        successRedirect,
        validateOnInput = true,
        delayMs = 300,
        timeoutMs = 8000,
        dataType = 'form',
        onSuccess,
        onError
    } = options;
    
    // Configure superForm
    const form = superForm(formData, {
        taintedMessage: false,
        validationMethod: validateOnInput ? 'oninput' : 'onsubmit',
        delayMs,
        timeoutMs,
        dataType,
        
        // Clear error messages when form submission starts
        onSubmit() {
            // Clear any previous error messages when starting a new submission
            errorMessage.set(null);
        },
        
        // Handle form submission results
        onResult: async ({ result }: { result: any }) => {
            // When result.data is a string (devalue serialization), Superforms cannot apply
            // field errors. Deserialize and manually apply form.errors so fields show red.
            let dataToUse = result.data;
            if (result.type === 'failure' && result.data && typeof result.data === 'string') {
                try {
                    const deserialized = deserialize(result.data) as { form?: { errors?: Record<string, string[]>; data?: Record<string, unknown> } };
                    dataToUse = deserialized;
                    // Apply form.errors to Superforms errors store so fields display validation errors
                    const formObj = deserialized?.form;
                    if (formObj?.errors && typeof formObj.errors === 'object') {
                        form.errors.set(formObj.errors as Record<string, string[]>);
                    }
                    // Apply form.data so the form reflects what was submitted
                    if (formObj?.data && typeof formObj.data === 'object') {
                        form.form?.set?.(formObj.data as any);
                    }
                } catch {
                    // Failed to deserialize, ignore
                }
            } else if (result.type === 'failure' && dataToUse?.form?.errors) {
                // result.data is already an object - apply form.errors if not done above
                const formObj = dataToUse.form;
                if (formObj?.errors && typeof formObj.errors === 'object') {
                    form.errors.set(formObj.errors as Record<string, string[]>);
                }
            }

            if (result.type === "success") {
                // Handle successful submission
                // Clear any previous error messages on success
                errorMessage.set(null);
                
                // Call custom success handler if provided
                let successResult: ApiSuccessResponse | void = undefined;
                if (onSuccess) {
                    successResult = onSuccess(result);
                }
                
                // Set success message from handler or default
                successMessage.set(successResult || createSuccessResponse('Operation completed successfully') as ApiSuccessResponse);
                
                // Navigate to success URL if provided
                if (successRedirect) {
                    try {
                        await goto(successRedirect);
                    } catch (error) {
                        errorMessage.set(createErrorResponse(
                            'Failed to redirect. Please try again.',
                            'NAVIGATION_ERROR',
                            error instanceof Error ? error.message : String(error)
                        ) as ApiErrorResponse);
                    }
                }
            } else if (result.type === "failure") {
                // Handle server errors - use dataToUse (may be deserialized)
                let errorSet = false;

                // Extract first field error for toast/ErrorAlert when we have form.errors
                const formErrors = dataToUse?.form?.errors;
                if (formErrors && typeof formErrors === 'object') {
                    const firstError = Object.values(formErrors).flat().find((m): m is string => typeof m === 'string');
                    if (firstError) {
                        errorMessage.set(createErrorResponse(firstError, 'VALIDATION_ERROR') as ApiErrorResponse);
                        errorSet = true;
                    }
                }

                if (!errorSet) {
                    // First, try to handle complex JSON error structures
                    if (result.data && typeof result.data === 'string') {
                        const parsedError = parseComplexErrorResponse(result.data);
                        if (parsedError) {
                            errorMessage.set(parsedError);
                            return;
                        }
                    }

                    // Check if the error message is in form.message (SuperForms structure)
                    if (dataToUse?.form?.message) {
                        const formMessage = dataToUse.form.message;
                        errorMessage.set(createErrorResponse(
                            formMessage.text || 'An error occurred',
                            formMessage.code || 'ERROR',
                            formMessage.details || undefined
                        ) as ApiErrorResponse);
                        return;
                    }

                    // Check if the server returned a message object directly
                    if (dataToUse?.message) {
                        const serverMessage = dataToUse.message;
                        errorMessage.set(createErrorResponse(
                            serverMessage.text || 'An error occurred',
                            serverMessage.code || 'ERROR',
                            serverMessage.details || undefined
                        ) as ApiErrorResponse);
                    }
                    // Check for form-level errors from Zod validation
                    else if (dataToUse?.form?.$errors?._errors?.length > 0) {
                        const formErrList = dataToUse.form.$errors._errors;
                        const errorText = formErrList[0] || "An error occurred during form submission";
                        const meta = dataToUse.form.$meta || {};
                        errorMessage.set(createErrorResponse(
                            errorText,
                            dataToUse.form.$id || 'VALIDATION_ERROR',
                            meta.details
                        ) as ApiErrorResponse);
                    } else {
                        // Fallback error handling
                        errorMessage.set(createErrorResponse("An error occurred while processing your request") as ApiErrorResponse);
                    }
                }
            }
        },
        
        // Clear field errors when user fixes them
        onUpdate({ form }: { form: any }) {
            if (form.valid) {
                toast.dismiss();
            }
        },
        
        // Handle any other errors including network errors
        onError({ result }: { result: any }) {
            if (typeof result.error === 'object' && result.error !== null) {
                // Handle structured error object
                const error = result.error as any;
                errorMessage.set(createErrorResponse(
                    error.message || "Server error occurred. Please try again.",
                    error.code || 'SERVER_ERROR',
                    error.details || undefined
                ) as ApiErrorResponse);
            } else {
                // Handle string error or undefined
                const errorText = typeof result.error === 'string' ? result.error : 
                    "Server error occurred. Please try again.";
                errorMessage.set(createErrorResponse(errorText) as ApiErrorResponse);
            }
            
            // Call custom error handler if provided
            let errorResult: ApiErrorResponse | void = undefined;
            if (onError) {
                errorResult = onError(result);
            }
            
            // Set error message from handler if provided
            if (errorResult) {
                errorMessage.set(errorResult);
            }
        }
    });
    
    return {
        ...form,
        errorMessage,
        successMessage,
        // Add a reset function to clear validation errors and form state
        reset: () => {
            // Clear error messages
            errorMessage.set(null);
            successMessage.set(null);
            
            // Dismiss any existing toasts
            toast.dismiss();
            
            // Reset form validation state
            if (form.reset) {
                form.reset();
            }
            
            // Clear any validation errors
            if (form.errors && typeof form.errors.set === 'function') {
                form.errors.set({});
            }
        }
    };
}
