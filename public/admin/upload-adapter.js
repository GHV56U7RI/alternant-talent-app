// Adaptateur personnalisé pour permettre l'upload de fichiers locaux
// Ce script intercepte les demandes d'upload et ouvre le sélecteur de fichiers

(function() {
  'use strict';

  console.log('📤 Upload adapter loaded');

  // Attendre que Decap CMS soit chargé
  if (window.CMS) {
    console.log('✅ CMS detected, registering custom media library');

    // Créer une bibliothèque de médias personnalisée
    window.CMS.registerMediaLibrary({
      name: 'local-upload',
      config: {}
    });
  } else {
    console.warn('⚠️ CMS not loaded yet');
  }
})();
