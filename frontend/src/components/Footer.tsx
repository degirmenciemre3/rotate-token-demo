import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { Github, Book, Shield } from 'lucide-react';

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-6 w-6 text-primary-600" />
              <span className="text-lg font-bold text-gray-900">Token Demo</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('footer.builtWith')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/documentation" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  <Book className="inline h-4 w-4 mr-2" />
                  {t('footer.documentation')}
                </Link>
              </li>
              <li>
                <Link to="/test" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  <Shield className="inline h-4 w-4 mr-2" />
                  {t('footer.security')}
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/degirmenciemre3/rotate-token-demo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Github className="inline h-4 w-4 mr-2" />
                  {t('footer.github')}
                </a>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Features
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>JWT Authentication</li>
              <li>Token Rotation</li>
              <li>Security Best Practices</li>
              <li>Responsive Design</li>
              <li>Multi-language Support</li>
              <li>Complete Documentation</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            {t('footer.copyright')}
          </p>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <span className="text-xs text-gray-400">Emre Değirmenci</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
