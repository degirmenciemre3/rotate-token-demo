import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';

const Documentation: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">{t('documentation.title')}</h1>
            <p className="text-blue-100 mt-2">{t('documentation.subtitle')}</p>
          </div>

          <div className="px-6 py-8">
            {/* Overview */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('documentation.overview')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('documentation.overviewDesc')}</p>
            </section>

            {/* What is Token Rotation */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('documentation.whatIsTokenRotation')}</h2>
              <p className="text-gray-600 leading-relaxed">{t('documentation.tokenRotationDesc')}</p>
            </section>

            {/* Architecture */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('documentation.architecture')}</h2>
              <p className="text-gray-600 mb-4">{t('documentation.architectureDesc')}</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('documentation.frontend')}</h3>
                  <div className="text-blue-700 whitespace-pre-line text-sm">{t('documentation.frontendDesc')}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">{t('documentation.backend')}</h3>
                  <div className="text-green-700 whitespace-pre-line text-sm">{t('documentation.backendDesc')}</div>
                </div>
              </div>
            </section>

            {/* Security Features */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('documentation.security')}</h2>
              <p className="text-gray-600 mb-4">{t('documentation.securityDesc')}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-2">
                  <span>{t('documentation.securityFeature1')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span>{t('documentation.securityFeature2')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span>{t('documentation.securityFeature3')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span>{t('documentation.securityFeature4')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span>{t('documentation.securityFeature5')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span>{t('documentation.securityFeature6')}</span>
                </div>
              </div>
            </section>

            {/* Token Lifecycle */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('documentation.tokenLifecycle')}</h2>
              <p className="text-gray-600 mb-4">{t('documentation.lifecycleDesc')}</p>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-gray-800">{t('documentation.lifecycle1')}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-gray-800">{t('documentation.lifecycle2')}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-gray-800">{t('documentation.lifecycle3')}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-gray-800">{t('documentation.lifecycle4')}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-gray-800">{t('documentation.lifecycle5')}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-gray-800">{t('documentation.lifecycle6')}</div>
                </div>
              </div>
            </section>

            {/* API Endpoints */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('documentation.apiEndpoints')}</h2>
              <p className="text-gray-600 mb-4">{t('documentation.endpointsDesc')}</p>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('documentation.publicEndpoints')}</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <ul className="space-y-1 text-sm">
                      <li><code className="bg-gray-200 px-2 py-1 rounded">POST /api/v1/auth/register</code> - User registration</li>
                      <li><code className="bg-gray-200 px-2 py-1 rounded">POST /api/v1/auth/login</code> - User login</li>
                      <li><code className="bg-gray-200 px-2 py-1 rounded">POST /api/v1/auth/refresh</code> - Token refresh</li>
                      <li><code className="bg-gray-200 px-2 py-1 rounded">GET /api/v1/health</code> - Health check</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('documentation.protectedEndpoints')}</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <ul className="space-y-1 text-sm">
                      <li><code className="bg-gray-200 px-2 py-1 rounded">POST /api/v1/auth/logout</code> - User logout</li>
                      <li><code className="bg-gray-200 px-2 py-1 rounded">GET /api/v1/profile</code> - User profile</li>
                      <li><code className="bg-gray-200 px-2 py-1 rounded">GET /api/v1/protected</code> - Protected resource</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('documentation.debugEndpoints')}</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <ul className="space-y-1 text-sm">
                      <li><code className="bg-gray-200 px-2 py-1 rounded">GET /api/v1/debug/token-info</code> - Token information</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Use Cases */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('documentation.useCases')}</h2>
              <p className="text-gray-600 mb-4">{t('documentation.useCasesDesc')}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <span>{t('documentation.useCase1')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>{t('documentation.useCase2')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>{t('documentation.useCase3')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>{t('documentation.useCase4')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>{t('documentation.useCase5')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>{t('documentation.useCase6')}</span>
                </div>
              </div>
            </section>

            {/* Implementation Guide */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('documentation.implementation')}</h2>
              <p className="text-gray-600 mb-4">{t('documentation.implDesc')}</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>{t('documentation.impl1')}</li>
                <li>{t('documentation.impl2')}</li>
                <li>{t('documentation.impl3')}</li>
                <li>{t('documentation.impl4')}</li>
                <li>{t('documentation.impl5')}</li>
                <li>{t('documentation.impl6')}</li>
              </ol>
            </section>

            {/* Best Practices */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('documentation.bestPractices')}</h2>
              <p className="text-gray-600 mb-4">{t('documentation.practicesDesc')}</p>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span>{t('documentation.practice1')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span>{t('documentation.practice2')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span>{t('documentation.practice3')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span>{t('documentation.practice4')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span>{t('documentation.practice5')}</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span>{t('documentation.practice6')}</span>
                </div>
              </div>
            </section>

            {/* Navigation */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center">
                <Link 
                  to="/dashboard"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  ← {t('navigation.dashboard')}
                </Link>
                <Link 
                  to="/test"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  {t('navigation.testProtected')} →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
