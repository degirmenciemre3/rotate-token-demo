import { useState } from 'react';
import { Shield, CheckCircle, XCircle, Play, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface TestResult {
  success: boolean;
  message: string;
  timestamp: Date;
  responseTime: number;
  data?: any;
  error?: string;
}

export default function TestProtected() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addTestResult = (result: Omit<TestResult, 'timestamp'>) => {
    setTestResults(prev => [{
      ...result,
      timestamp: new Date()
    }, ...prev].slice(0, 10));
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    try {
      const data = await testFn();
      const responseTime = Date.now() - startTime;
      
      addTestResult({
        success: true,
        message: `${testName} - Success`,
        responseTime,
        data
      });
      
      toast.success(`${testName} completed successfully`);
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      
      addTestResult({
        success: false,
        message: `${testName} - Failed`,
        responseTime,
        error: errorMessage
      });
      
      toast.error(`${testName} failed: ${errorMessage}`);
    }
  };

  const testProtectedEndpoint = async () => {
    setIsRunning(true);
    try {
      await runTest('Protected Endpoint Test', () => api.testProtectedEndpoint());
    } finally {
      setIsRunning(false);
    }
  };

  const testTokenRefresh = async () => {
    setIsRunning(true);
    try {
      await runTest('Manual Token Refresh', () => api.manualRefresh());
    } finally {
      setIsRunning(false);
    }
  };

  const testHealthCheck = async () => {
    setIsRunning(true);
    try {
      await runTest('Health Check', () => api.healthCheck());
    } finally {
      setIsRunning(false);
    }
  };

  const testUserProfile = async () => {
    setIsRunning(true);
    try {
      await runTest('User Profile', () => api.getProfile());
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    try {
      await testHealthCheck();
      await new Promise(resolve => setTimeout(resolve, 500));
      await testUserProfile();
      await new Promise(resolve => setTimeout(resolve, 500));
      await testProtectedEndpoint();
      await new Promise(resolve => setTimeout(resolve, 500));
      await testTokenRefresh();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Protected Route Testing</h1>
            <p className="text-gray-600 mt-1">
              Test API endpoints and token functionality
            </p>
          </div>
          <Shield className="h-12 w-12 text-primary-600" />
        </div>
      </div>

      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Controls</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={testHealthCheck}
            disabled={isRunning}
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Health Check
          </button>

          <button
            onClick={testUserProfile}
            disabled={isRunning}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Shield className="h-5 w-5 mr-2" />
            User Profile
          </button>

          <button
            onClick={testProtectedEndpoint}
            disabled={isRunning}
            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Shield className="h-5 w-5 mr-2" />
            Protected Route
          </button>

          <button
            onClick={testTokenRefresh}
            disabled={isRunning}
            className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Clock className="h-5 w-5 mr-2" />
            Token Refresh
          </button>

          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:col-span-2"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Run All Tests
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {testResults.map((result, index) => (
              <div key={index} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${
                    result.success ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {result.success ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${
                        result.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {result.message}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{result.responseTime}ms</span>
                        <span>{result.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </div>
                    
                    {result.error && (
                      <div className="mt-2 p-3 bg-red-50 rounded-md">
                        <div className="flex items-start">
                          <AlertTriangle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{result.error}</p>
                        </div>
                      </div>
                    )}
                    
                    {result.data && (
                      <div className="mt-3">
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                            View Response Data
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <pre className="text-xs text-gray-800 overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <Shield className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-2">Testing Information</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>Health Check:</strong> Tests if the API server is running</p>
              <p>• <strong>User Profile:</strong> Tests authenticated endpoint access</p>
              <p>• <strong>Protected Route:</strong> Tests JWT token validation</p>
              <p>• <strong>Token Refresh:</strong> Tests token rotation mechanism</p>
              <p>• <strong>Response Times:</strong> Monitor API performance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
