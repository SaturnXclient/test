import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import Button from './Button';

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  age: z.number().min(13, 'You must be at least 13 years old').max(120, 'Please enter a valid age'),
  country: z.string().min(1, 'Please select your country'),
  interest: z.string().optional(),
  source: z.string().optional(),
  role: z.string().min(1, 'Please select your role'),
  experience: z.string().optional(),
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
].sort((a, b) => a.name.localeCompare(b.name));

const roles = [
  'Developer',
  'Data Scientist',
  'Designer',
  'Product Manager',
  'Researcher',
  'Student',
  'Other'
];

const sources = [
  'Search Engine',
  'Social Media',
  'Friend/Colleague',
  'Blog/Article',
  'Conference/Event',
  'Advertisement',
  'Other',
];

const experienceLevels = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert'
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
      role: '',
      experience: '',
      privacyPolicy: false,
      termsOfService: false,
    },
  });

  useEffect(() => {
    const savedData = localStorage.getItem('earlyAccessForm');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      Object.entries(parsedData).forEach(([key, value]) => {
        setValue(key as keyof FormData, value);
      });
    }
  }, [setValue]);

  const formValues = watch();
  useEffect(() => {
    localStorage.setItem('earlyAccessForm', JSON.stringify(formValues));
    
    const requiredFields = ['fullName', 'email', 'age', 'country', 'role'];
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      localStorage.removeItem('earlyAccessForm');
      setSubmitSuccess(true);

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

        <div className="h-1 bg-white/10 rounded-full mb-8">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${formProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h1 className="text-3xl font-outfit font-bold">Get Early Access</h1>
          </div>
          <p className="text-gray-400 mb-8">
            Join our exclusive early access program and be among the first to experience Sarux AI.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                {...register('fullName')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Full Name"
              />
              {errors.fullName && (
                <p className="mt-1 text-red-400 text-sm">{errors.fullName.message}</p>
              )}
            </div>

            <div className="relative">
              <input
                type="email"
                {...register('email')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Email Address"
              />
              {errors.email && (
                <p className="mt-1 text-red-400 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="relative">
              <input
                type="number"
                {...register('age', { valueAsNumber: true })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="Age"
              />
              {errors.age && (
                <p className="mt-1 text-red-400 text-sm">{errors.age.message}</p>
              )}
            </div>

            <div className="relative">
              <select
                {...register('country')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                style={{ colorScheme: 'dark' }}
              >
                <option value="" className="bg-background">Select Country/Region</option>
                {countries.map(country => (
                  <option key={country.code} value={country.code} className="bg-background">
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className="mt-1 text-red-400 text-sm">{errors.country.message}</p>
              )}
            </div>

            <div className="relative">
              <select
                {...register('role')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                style={{ colorScheme: 'dark' }}
              >
                <option value="" className="bg-background">Select Your Role</option>
                {roles.map(role => (
                  <option key={role} value={role} className="bg-background">
                    {role}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-red-400 text-sm">{errors.role.message}</p>
              )}
            </div>

            <div className="relative">
              <select
                {...register('experience')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                style={{ colorScheme: 'dark' }}
              >
                <option value="" className="bg-background">Experience Level (Optional)</option>
                {experienceLevels.map(level => (
                  <option key={level} value={level} className="bg-background">
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <textarea
                {...register('interest')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors min-h-[100px] resize-none"
                placeholder="Why are you interested in early access? (Optional)"
              />
            </div>

            <div className="relative">
              <select
                {...register('source')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors appearance-none"
                style={{ colorScheme: 'dark' }}
              >
                <option value="" className="bg-background">How did you hear about us? (Optional)</option>
                {sources.map(source => (
                  <option key={source} value={source} className="bg-background">
                    {source}
                  </option>
                ))}
              </select>
            </div>

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