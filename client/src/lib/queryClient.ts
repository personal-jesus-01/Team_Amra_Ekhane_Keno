import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiBaseUrl } from "./firebase-config";

// Get the base URL for API requests
const getApiUrl = (endpoint: string) => {
  // In production, don't use API endpoints at all (frontend-only)
  if (!import.meta.env.DEV && endpoint.startsWith('/api')) {
    console.warn('Attempted API call in production mode:', endpoint);
    // Return a dummy URL that will fail gracefully
    return `https://dummy-no-backend-in-production/api`;
  }

  // If endpoint already starts with http, it's an absolute URL
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // If endpoint starts with /api, use the configured apiBaseUrl (only in development)
  if (endpoint.startsWith('/api')) {
    return `${apiBaseUrl}${endpoint}`;
  }
  
  // Otherwise, just use the relative path
  return endpoint;
};

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { isFormData?: boolean, handleAuth?: boolean }
): Promise<Response> {
  // Use the getApiUrl helper to handle deployed environment
  const fullUrl = getApiUrl(url);
  
  const headers: Record<string, string> = {};
  let body: any = undefined;
  
  // In development mode, add a test token for authorization
  if (import.meta.env.DEV) {
    headers["Authorization"] = "Bearer dev-test-token";
  }
  
  if (data) {
    if (options?.isFormData) {
      // FormData doesn't need content-type header, browser sets it with boundary
      body = data;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body,
    credentials: "include",
  });

  // Handle authentication issues (401) in production frontend-only mode 
  if (res.status === 401 && !import.meta.env.DEV && options?.handleAuth !== false) {
    console.warn('Unauthenticated API request in production mode - returning mock data for:', url);
    
    // In production, simulate a successful response with mock data
    // This allows us to demonstrate functionality without backend
    return new Response(JSON.stringify({ success: true, mockData: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw" | "mockData";
export const getQueryFn = <T,>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> => {
  return async ({ queryKey }) => {
    // Use the getApiUrl helper to handle deployed environment
    const fullUrl = getApiUrl(queryKey[0] as string);
    const url = queryKey[0] as string;
    const unauthorizedBehavior = options.on401;
    
    // Setup headers
    const headers: Record<string, string> = {};
    
    // In development mode, add auth token for all API requests
    if (import.meta.env.DEV) {
      headers["Authorization"] = "Bearer dev-test-token";
    }
    
    const res = await fetch(fullUrl, {
      credentials: "include",
      headers
    });

    // Handle auth issues consistently in both production and development
    if (res.status === 401 && 
        (unauthorizedBehavior === "mockData" || 
         (unauthorizedBehavior === "returnNull" && url.includes('/coach/')))) {
      
      if (import.meta.env.DEV) {
        console.warn('Auth error in development mode - using mock data:', url);
        
        // In development, show error in console for debugging
        const errorText = await res.text();
        console.error(`Auth error response: ${errorText}`);
      } else {
        console.warn('Using mock data for query in production mode:', url);
      }
      
      // Generate different mock data based on the API endpoint
      if (url.includes('/coach/sessions')) {
        const mockData = getMockCoachSessions();
        return mockData as any;
      }
      if (url.includes('/presentations')) {
        const mockData = getMockPresentations();
        return mockData as any;
      }
      
      // Default mock data
      const defaultMockData = { success: true, mockData: true };
      return defaultMockData as any;
    }

    // Normal auth handling
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };
};

// Mock data for presentations
function getMockPresentations() {
  return [
    {
      id: 1001,
      user_id: 1,
      title: "Sample Presentation",
      description: "A demo presentation for testing",
      thumbnail_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      slide_count: 5,
      is_public: false
    }
  ];
}

// Mock data for coach sessions
function getMockCoachSessions() {
  return [
    {
      id: 1001,
      user_id: 1,
      presentation_id: 1001,
      created_at: new Date().toISOString(),
      duration: 180, // 3 minutes
      content_coverage: 85,
      pace_score: 72,
      clarity_score: 80,
      eye_contact_score: 65,
      overall_score: 75
    }
  ];
}

// Handle the TanStack Query v5 configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: false,
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  }
});
