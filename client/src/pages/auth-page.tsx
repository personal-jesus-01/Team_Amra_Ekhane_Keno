import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { Loader2, Mail, Lock } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Authentication methods
const METHODS = {
  EMAIL_PASSWORD: "email-password",
} as const;

// Authentication stages
const STAGES = {
  SELECT_METHOD: "select-method",
  LOGIN: "login",
  REGISTER: "register",
} as const;

// Email + Password Login schema
const emailLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

// Registration schema
const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: "Username must be at least 3 characters" }),
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type EmailLoginValues = z.infer<typeof emailLoginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  // Auth state
  const [authMethod, setAuthMethod] = useState<string>(METHODS.EMAIL_PASSWORD);
  const [authStage, setAuthStage] = useState<string>(STAGES.SELECT_METHOD);

  const {
    user,
    loginMutation,
    registerMutation,
    googleSignInMutation,
  } = useAuth();

  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Email + Password login form
  const emailLoginForm = useForm<EmailLoginValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: "test@test.com", // Pre-filled for demo
      password: "12345678",   // Pre-filled for demo
    },
  });

  // Registration form
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle email + password login
  const onEmailLoginSubmit = async (data: EmailLoginValues) => {
    loginMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  // Handle registration
  const onRegisterSubmit = (data: RegisterValues) => {
    // Remove confirmPassword as it's not needed for the API
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // Handle back navigation
  const handleBack = () => {
    setAuthStage(STAGES.SELECT_METHOD);
  };

  // Renders the appropriate authentication UI based on stage and method
  const renderAuthContent = () => {
    // Initial method selection screen
    if (authStage === STAGES.SELECT_METHOD) {
      return (
        <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold text-center mb-6 text-white">Sign in with</h3>
            <div className="grid gap-4">
              <GoogleSignInButton 
                variant="default"
                onSuccess={() => navigate("/")}
              />
              
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-900 px-2 text-gray-400">
                    or
                  </span>
                </div>
              </div>
              
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 h-12 bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={() => {
                  setAuthMethod(METHODS.EMAIL_PASSWORD);
                  setAuthStage(STAGES.LOGIN);
                }}
              >
                <Mail className="h-4 w-4" />
                <span>Email & Password</span>
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-900 px-2 text-gray-400">
                    or
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 h-12 bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={() => {
                  setAuthStage(STAGES.REGISTER);
                }}
              >
                <span>Create New Account</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Email + Password login
    else if (
      authStage === STAGES.LOGIN &&
      authMethod === METHODS.EMAIL_PASSWORD
    ) {
      return (
        <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-8 w-8 mr-2 text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={handleBack}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-chevron-left"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Button>
              <h3 className="text-xl font-bold text-white">Sign in with Email</h3>
            </div>

            <Form {...emailLoginForm}>
              <form
                onSubmit={emailLoginForm.handleSubmit(onEmailLoginSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={emailLoginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={emailLoginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      );
    }

    // Registration
    else if (authStage === STAGES.REGISTER) {
      return (
        <Card className="bg-gray-900/90 border-gray-700 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-8 w-8 mr-2 text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={handleBack}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-chevron-left"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Button>
              <h3 className="text-xl font-bold text-white">Create Account</h3>
            </div>

            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={registerForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="johndoe" 
                          className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••"
                          type="password"
                          className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••"
                          type="password"
                          className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(156, 146, 172, 0.1) 1px, transparent 0)`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        

      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left section - Authentication Form */}
        <div className="flex items-center justify-center w-full lg:w-1/2 px-6 py-12">
          <div className="w-full max-w-md">
            {/* Header Section */}
            <div className="text-center space-y-6 mb-10">
              <div className="flex justify-center">
                <div className="relative">
                  <Logo size="lg" />
                  <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-lg"></div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-indigo-200 bg-clip-text text-transparent">
                  SlideBanai
                </h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Create stunning presentations with the power of AI
                </p>
              </div>
            </div>

            {/* Auth Form Container */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 shadow-xl">
              {renderAuthContent()}
            </div>
          </div>
        </div>

        {/* Right section - Hero Area */}
        <div className="hidden lg:flex flex-col items-center justify-center w-1/2 px-8 py-12 relative">
          {/* Glass Morphism Container */}
          <div className="max-w-xl space-y-8 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-10 shadow-2xl">
            {/* Hero Content */}
            <div className="text-center space-y-6">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                Transform Your Presentation Experience
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Generate professional presentations in minutes with our AI-powered platform
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4 mt-10 transform-gpu perspective-1000" style={{ transformStyle: 'preserve-3d' }}>
              <div className="group bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-5 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all duration-500 transform-gpu hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-2 hover:rotateX(5deg) hover:rotateY(5deg)" 
                   style={{
                     animation: 'cardFloat3d 6s ease-in-out infinite',
                     transform: 'rotateX(2deg) rotateY(2deg) translateZ(10px)',
                     transformStyle: 'preserve-3d'
                   }}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">AI-Powered</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Generate professional slides instantly with advanced AI technology
                </p>
              </div>

              <div className="group bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-xl p-5 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-500 transform-gpu hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-2 hover:rotateX(-5deg) hover:rotateY(5deg)" 
                   style={{
                     animation: 'cardFloat3d 8s ease-in-out infinite 1s',
                     transform: 'rotateX(-2deg) rotateY(2deg) translateZ(10px)',
                     transformStyle: 'preserve-3d'
                   }}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center transform-gpu hover:rotateY(180deg) transition-transform duration-500">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Templates</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Choose from beautiful, professionally designed templates
                </p>
              </div>

              <div className="group bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-emerald-500/20 rounded-xl p-5 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all duration-500 transform-gpu hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-2 hover:rotateX(5deg) hover:rotateY(-5deg)" 
                   style={{
                     animation: 'cardFloat3d 7s ease-in-out infinite 2s',
                     transform: 'rotateX(2deg) rotateY(-2deg) translateZ(10px)',
                     transformStyle: 'preserve-3d'
                   }}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center transform-gpu hover:rotateY(180deg) transition-transform duration-500">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Collaboration</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Work seamlessly with your team in real-time
                </p>
              </div>

              <div className="group bg-gradient-to-br from-rose-500/10 to-pink-500/10 backdrop-blur-sm border border-rose-500/20 rounded-xl p-5 hover:from-rose-500/20 hover:to-pink-500/20 transition-all duration-500 transform-gpu hover:scale-105 hover:shadow-lg hover:shadow-rose-500/10 hover:-translate-y-2 hover:rotateX(-5deg) hover:rotateY(-5deg)" 
                   style={{
                     animation: 'cardFloat3d 9s ease-in-out infinite 3s',
                     transform: 'rotateX(-2deg) rotateY(-2deg) translateZ(10px)',
                     transformStyle: 'preserve-3d'
                   }}>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg flex items-center justify-center transform-gpu hover:rotateY(180deg) transition-transform duration-500">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">AI Coach</h3>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Get AI-powered feedback to improve your presentation skills
                </p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center space-x-6 pt-8 border-t border-gray-700/50">
              <div className="flex items-center space-x-2 text-gray-400">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Secure & Private</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">Cloud Sync</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}