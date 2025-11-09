'use client';

import React, { useState } from 'react';
import { useCookies, CookiePreferences } from '../hooks/useCookies';

export default function CookieBanner() {
  const {
    showBanner,
    showManageModal,
    preferences,
    acceptAll,
    rejectAll,
    savePreferences,
    openManageModal,
    closeManageModal,
  } = useCookies();

  const [tempPreferences, setTempPreferences] = useState<CookiePreferences>(preferences);

  const handleToggle = (key: keyof CookiePreferences) => {
    if (key === 'necessary') return;
    setTempPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePreferences = () => {
    savePreferences(tempPreferences);
  };

  if (!showBanner && !showManageModal) return null;

  return (
    <>
      {showBanner && (
        <div className="cookie-banner">
          <div className="cookie-banner-content">
            <div className="cookie-banner-icon">🍪</div>
            <div className="cookie-banner-text">
              <h3 className="cookie-banner-title">We value your privacy</h3>
              <p className="cookie-banner-description">
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                By clicking "Accept All", you consent to our use of cookies.
              </p>
            </div>
            <div className="cookie-banner-actions">
              <button onClick={acceptAll} className="cookie-btn cookie-btn-accept">
                Accept All
              </button>
              <button onClick={rejectAll} className="cookie-btn cookie-btn-reject">
                Reject All
              </button>
              <button onClick={openManageModal} className="cookie-btn cookie-btn-manage">
                Manage Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {showManageModal && (
        <div className="cookie-modal-overlay" onClick={closeManageModal}>
          <div className="cookie-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cookie-modal-header">
              <h2 className="cookie-modal-title">Manage Cookie Preferences</h2>
              <button onClick={closeManageModal} className="cookie-modal-close">×</button>
            </div>

            <div className="cookie-modal-body">
              <p className="cookie-modal-intro">
                We use cookies to improve your experience on our site. You can choose which types of cookies to allow. 
                Note that blocking some types may impact your experience.
              </p>

              <div className="cookie-preferences-list">
                <div className="cookie-preference-item">
                  <div className="cookie-preference-header">
                    <div className="cookie-preference-info">
                      <h4 className="cookie-preference-title">
                        Strictly Necessary Cookies
                        <span className="cookie-badge required">Required</span>
                      </h4>
                      <p className="cookie-preference-description">
                        These cookies are essential for the website to function properly. They enable core functionality 
                        such as security, network management, and accessibility. You cannot disable these cookies.
                      </p>
                    </div>
                    <div className="cookie-toggle">
                      <input
                        type="checkbox"
                        id="necessary"
                        checked={true}
                        disabled
                        className="cookie-toggle-input"
                      />
                      <label htmlFor="necessary" className="cookie-toggle-label disabled">
                        <span className="cookie-toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="cookie-preference-item">
                  <div className="cookie-preference-header">
                    <div className="cookie-preference-info">
                      <h4 className="cookie-preference-title">Functional Cookies</h4>
                      <p className="cookie-preference-description">
                        These cookies allow us to remember choices you make and provide enhanced features. 
                        For example, remembering your theme preference or login details.
                      </p>
                    </div>
                    <div className="cookie-toggle">
                      <input
                        type="checkbox"
                        id="functional"
                        checked={tempPreferences.functional}
                        onChange={() => handleToggle('functional')}
                        className="cookie-toggle-input"
                      />
                      <label htmlFor="functional" className="cookie-toggle-label">
                        <span className="cookie-toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="cookie-preference-item">
                  <div className="cookie-preference-header">
                    <div className="cookie-preference-info">
                      <h4 className="cookie-preference-title">Analytics Cookies</h4>
                      <p className="cookie-preference-description">
                        These cookies help us understand how visitors interact with our website by collecting and 
                        reporting information anonymously. This helps us improve our content and services.
                      </p>
                    </div>
                    <div className="cookie-toggle">
                      <input
                        type="checkbox"
                        id="analytics"
                        checked={tempPreferences.analytics}
                        onChange={() => handleToggle('analytics')}
                        className="cookie-toggle-input"
                      />
                      <label htmlFor="analytics" className="cookie-toggle-label">
                        <span className="cookie-toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="cookie-preference-item">
                  <div className="cookie-preference-header">
                    <div className="cookie-preference-info">
                      <h4 className="cookie-preference-title">Marketing Cookies</h4>
                      <p className="cookie-preference-description">
                        These cookies track your online activity to help advertisers deliver more relevant advertising 
                        or to limit how many times you see an ad. They may be set by us or third parties.
                      </p>
                    </div>
                    <div className="cookie-toggle">
                      <input
                        type="checkbox"
                        id="marketing"
                        checked={tempPreferences.marketing}
                        onChange={() => handleToggle('marketing')}
                        className="cookie-toggle-input"
                      />
                      <label htmlFor="marketing" className="cookie-toggle-label">
                        <span className="cookie-toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="cookie-modal-footer">
              <button onClick={handleSavePreferences} className="cookie-btn cookie-btn-save">
                Save Preferences
              </button>
              <button onClick={acceptAll} className="cookie-btn cookie-btn-accept-all">
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}