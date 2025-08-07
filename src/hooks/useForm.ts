import { useState, useCallback } from 'react'

export interface FormErrors {
  [key: string]: string | undefined
}

export interface UseFormOptions<T> {
  initialValues: T
  validate?: (values: T) => FormErrors
  onSubmit: (values: T) => Promise<void> | void
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    setIsDirty(true)
    
    // Clear error for this field when user starts typing
    if (errors[name as string]) {
      setErrors(prev => ({ ...prev, [name as string]: undefined }))
    }
  }, [errors])

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name as string]: error }))
  }, [])

  const reset = useCallback((newValues?: T) => {
    setValues(newValues || initialValues)
    setErrors({})
    setIsDirty(false)
  }, [initialValues])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    // Validate form
    const validationErrors = validate ? validate(values) : {}
    setErrors(validationErrors)

    // Don't submit if there are validation errors
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
      setIsDirty(false)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate, onSubmit])

  return {
    values,
    errors,
    isSubmitting,
    isDirty,
    setValue,
    setFieldError,
    reset,
    handleSubmit
  }
} 