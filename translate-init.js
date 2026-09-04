// Google Translate bootstrap. Kept in a local script so CSP does not block an inline callback.
function googleTranslateElementInit(){
  try{
    if(!window.google?.translate?.TranslateElement) return;
    new window.google.translate.TranslateElement({
      pageLanguage:'pt',
      includedLanguages:'pt,zh-CN',
      autoDisplay:false,
      multilanguagePage:true
    },'google_translate_element');
    window.__googleTranslateReady=true;
    window.dispatchEvent(new Event('google-translate-ready'));
  }catch(e){ console.warn('Google Translate init failed',e); }
}
