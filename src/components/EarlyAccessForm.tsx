import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from './Button';

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  age: z.number().min(13, 'You must be at least 13 years old').max(120, 'Please enter a valid age'),
  country: z.string().min(1, 'Please select your country'),
  interest: z.string().optional(),
  source: z.string().optional(),
  privacyPolicy: z.boolean().refine((val) => val === true, {
    message: 'You must accept the privacy policy',
  }),
  termsOfService: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms of service',
  }),
});

type FormData = z.infer<typeof schema>;

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  // Add more countries as needed
].sort((a, b) => a.name.localeCompare(b.name));

const sources = [
  'Search Engine',
  'Social Media',
  'Friend/Colleague',
  'Blog/Article',
  'Conference/Event',
  'Advertisement',
  'Other',
];

const EarlyAccessForm = () => {
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formProgress, setFormProgress] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      age: undefined,
      country: '',
      interest: '',
      source: '',
      privacyPolicy: false,
      termsOfService: false,
    },
  });

  // Load saved form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('earlyAccessForm');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      Object.entries(parsedData).forEach(([key, value]) => {
        setValue(key as keyof FormData, value);
      });
    }
  }, [setValue]);

  // Save form data to localStorage when fields change
  const formValues = watch();
  useEffect(() => {
    localStorage.setItem('earlyAccessForm', JSON.stringify(formValues));
    
    // Calculate form progress
    const requiredFields = ['fullName', 'email', 'age', 'country'];
    const completedFields = requiredFields.filter(field => 
      dirtyFields[field as keyof FormData]
    ).length;
    setFormProgress((completedFields / requiredFields.length) * 100);
  }, [formValues, dirtyFields]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      if (!executeRecaptcha) {
        throw new Error('reCAPTCHA not initialized');
      }

      const token = await executeRecaptcha('early_access');

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear saved form data
      localStorage.removeItem('earlyAccessForm');
      
      setSubmitSuccess(true);

      // Simulate sending confirmation email
      console.log('Sending confirmation email to:', data.email);

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-md p-8 rounded-2xl max-w-md w-full text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-outfit font-bold mb-4">Registration Successful!</h2>
          <p className="text-gray-300 mb-6">
            Thank you for registering for early access. We've sent a confirmation email to your inbox.
          </p>
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </button>

        {/* Progress Bar */}
        <div className="h-1 bg-white/10 rounded-full mb-8">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${formProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 md:p-8">
          <h1 className="text-3xl font-outfit font-bold mb-2">Get Early Access</h1>
          <p className="text-gray-400 mb-8">
            Join our exclusive early access program and be among the first to experience Sarux AI.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div className="relative">
              <input
                type="text"
                {...register('fullName')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-transparent peer focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Full Name"
                id="fullName"
              />
              <label
                htmlFor="fullName"
                className="absolute left-4 -top-6 text-sm text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3 transition-all peer-focus:-top-6 peer-focus:text-sm peer-focus:text-purple-500"
              >
                Full Name
              </label>
              {errors.fullName && (
                <p className="mt-1 text-red-400 text-sm">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="relative">
              <input
                type="email"
                {...register('email')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-transparent peer focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Email"
                id="email"
              />
              <label
                htmlFor="email"
                className="absolute left-4 -top-6 text-sm text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3 transition-all peer-focus:-top-6 peer-focus:text-sm peer-focus:text-purple-500"
              >
                Email Address
              </label>
              {errors.email && (
                <p className="mt-1 text-red-400 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Age */}
            <div className="relative">
              <input
                type="number"
                {...register('age', { valueAsNumber: true })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-transparent peer focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Age"
                id="age"
              />
              <label
                htmlFor="age"
                className="absolute left-4 -top-6 text-sm text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3 transition-all peer-focus:-top-6 peer-focus:text-sm peer-focus:text-purple-500"
              >
                Age
              </label>
              {errors.age && (
                <p className="mt-1 text-red-400 text-sm">{errors.age.message}</p>
              )}
            </div>

            {/* Country */}
            <div className="relative">
              <select
                {...register('country')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                id="country"
              >
                <option value="">Select Country/Region</option>
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className="mt-1 text-red-400 text-sm">{errors.country.message}</p>
              )}
            </div>

            {/* Interest */}
            <div className="relative">
              <textarea
                {...register('interest')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-transparent peer focus:outline-none focus:border-purple-500 transition-colors min-h-[100px]"
                placeholder="Why are you interested?"
                id="interest"
              />
              <label
                htmlFor="interest"
                className="absolute left-4 -top-6 text-sm text-gray-400 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3 transition-all peer-focus:-top-6 peer-focus:text-sm peer-focus:text-purple-500"
              >
                Why are you interested in early access? (Optional)
              </label>
            </div>

            {/* Source */}
            <div className="relative">
              <select
                {...register('source')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                id="source"
              >
                <option value="">How did you hear about us? (Optional)</option>
                {sources.map(source => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            {/* Agreements */}
            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  {...register('privacyPolicy')}
                  id="privacyPolicy"
                  className="mt-1 mr-3"
                />
                <label htmlFor="privacyPolicy" className="text-sm text-gray-300">
                  I agree to the{' '}
                  <a href="#" className="text-purple-500 hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.privacyPolicy && (
                <p className="text-red-400 text-sm">{errors.privacyPolicy.message}</p>
              )}

              <div className="flex items-start">
                <input
                  type="checkbox"
                  {...register('termsOfService')}
                  id="termsOfService"
                  className="mt-1 mr-3"
                />
                <label htmlFor="termsOfService" className="text-sm text-gray-300">
                  I agree to the{' '}
                  <a href="#" className="text-purple-500 hover:underline">
                    Terms of Service
                  </a>
                </label>
              </div>
              {errors.termsOfService && (
                <p className="text-red-400 text-sm">{errors.termsOfService.message}</p>
              )}
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <p className="text-red-400 text-sm">{submitError}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Registration'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EarlyAccessForm;