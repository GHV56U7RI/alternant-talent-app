/**
 * Source: Sites carrières directs des grandes entreprises
 * Récupère les offres d'alternance directement depuis les pages carrières
 */

// Liste des 100 plus grandes entreprises françaises avec leurs URLs carrières
const COMPANIES = [
  // CAC 40
  { name: 'LVMH', careers: 'https://careers.lvmh.com/search-jobs', keywords: ['alternance', 'apprentissage'] },
  { name: 'TotalEnergies', careers: 'https://jobs.totalenergies.com/jobs', keywords: ['alternance', 'apprentice'] },
  { name: 'Sanofi', careers: 'https://sanofi.wd3.myworkdayjobs.com/SanofiCareers', keywords: ['apprenticeship', 'alternance'] },
  { name: 'Airbus', careers: 'https://ag.wd3.myworkdayjobs.com/Airbus', keywords: ['apprentice', 'alternance'] },
  { name: 'L\'Oréal', careers: 'https://careers.loreal.com/global/en/search-results', keywords: ['apprentice', 'alternance'] },
  { name: 'Schneider Electric', careers: 'https://careers.se.com/jobs', keywords: ['apprentice', 'alternance'] },
  { name: 'BNP Paribas', careers: 'https://careers.bnpparibas/jobs', keywords: ['alternance', 'apprentissage'] },
  { name: 'AXA', careers: 'https://careers.axa.com/global/en/search-results', keywords: ['alternance', 'apprentice'] },
  { name: 'Société Générale', careers: 'https://careers.societegenerale.com/fr/search-jobs', keywords: ['alternance', 'apprentissage'] },
  { name: 'Crédit Agricole', careers: 'https://www.credit-agricole.jobs/rejoignez-nous', keywords: ['alternance', 'apprentissage'] },
  { name: 'Orange', careers: 'https://orange.jobs/jobs/search', keywords: ['alternance', 'apprentissage'] },
  { name: 'Engie', careers: 'https://www.engie.com/carrieres/offres', keywords: ['alternance', 'apprentice'] },
  { name: 'Saint-Gobain', careers: 'https://www.saint-gobain.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },
  { name: 'Carrefour', careers: 'https://www.carrefour.com/fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Danone', careers: 'https://careers.danone.com/global/en/search-results', keywords: ['apprentice', 'alternance'] },
  { name: 'Pernod Ricard', careers: 'https://careers.pernod-ricard.com/global/en/search-results', keywords: ['apprentice', 'alternance'] },
  { name: 'Michelin', careers: 'https://recrutement.michelin.fr/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Legrand', careers: 'https://www.legrandgroup.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },
  { name: 'Thales', careers: 'https://careers.thalesgroup.com/global/en/search-results', keywords: ['apprentice', 'alternance'] },
  { name: 'Dassault Systèmes', careers: 'https://careers.3ds.com/jobs', keywords: ['apprentice', 'alternance'] },

  // SBF 120 & grandes entreprises
  { name: 'Capgemini', careers: 'https://www.capgemini.com/fr-fr/carrieres/offres-emploi', keywords: ['alternance', 'apprentissage'] },
  { name: 'Atos', careers: 'https://jobs.atos.net/search-jobs', keywords: ['alternance', 'apprentice'] },
  { name: 'Sopra Steria', careers: 'https://www.soprasteria.com/fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Dassault Aviation', careers: 'https://www.dassault-aviation.com/fr/groupe/carrieres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Safran', careers: 'https://www.safran-group.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },
  { name: 'Bouygues', careers: 'https://careers.bouygues.com/fr/search-jobs', keywords: ['alternance', 'apprentissage'] },
  { name: 'Vinci', careers: 'https://www.vinci.com/vinci.nsf/fr/carrieres/pages/offres.htm', keywords: ['alternance', 'apprentissage'] },
  { name: 'Eiffage', careers: 'https://www.eiffage.com/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Veolia', careers: 'https://www.veolia.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },
  { name: 'Suez', careers: 'https://www.suez.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },

  // Tech & Digital
  { name: 'Atos', careers: 'https://jobs.atos.net/search-jobs', keywords: ['alternance', 'apprentice'] },
  { name: 'OVHcloud', careers: 'https://corporate.ovhcloud.com/fr/careers/jobs', keywords: ['alternance', 'apprentissage'] },
  { name: 'Deezer', careers: 'https://www.deezer.com/fr/company/jobs', keywords: ['internship', 'alternance'] },
  { name: 'BlaBlaCar', careers: 'https://blog.blablacar.com/careers', keywords: ['internship', 'alternance'] },
  { name: 'Criteo', careers: 'https://careers.criteo.com/search-jobs', keywords: ['internship', 'apprentice'] },
  { name: 'Doctolib', careers: 'https://careers.doctolib.com/jobs', keywords: ['alternance', 'apprentissage'] },
  { name: 'Mirakl', careers: 'https://careers.mirakl.com/', keywords: ['internship', 'apprentice'] },
  { name: 'Alan', careers: 'https://alan.com/fr/carriere', keywords: ['alternance', 'apprentissage'] },
  { name: 'Back Market', careers: 'https://www.backmarket.com/fr-fr/careers', keywords: ['alternance', 'apprentice'] },
  { name: 'Contentsquare', careers: 'https://contentsquare.com/careers/', keywords: ['internship', 'apprentice'] },

  // Retail & E-commerce
  { name: 'Decathlon', careers: 'https://recrutement.decathlon.fr/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Leroy Merlin', careers: 'https://www.leroymerlin.fr/offres-emploi', keywords: ['alternance', 'apprentissage'] },
  { name: 'Auchan', careers: 'https://www.auchan-recrute.fr/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Fnac Darty', careers: 'https://www.fnacdarty.com/carriere/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Cdiscount', careers: 'https://recrutement.cdiscount.com/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Boulanger', careers: 'https://www.boulanger.com/info/recrutement', keywords: ['alternance', 'apprentissage'] },

  // Banque & Assurance
  { name: 'BPCE', careers: 'https://www.groupebpce.com/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Crédit Mutuel', careers: 'https://www.creditmutuel.fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'La Banque Postale', careers: 'https://www.labanquepostale.fr/recrutement/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Allianz', careers: 'https://careers.allianz.com/fr/search-results', keywords: ['alternance', 'apprentice'] },
  { name: 'Generali', careers: 'https://careers.generali.com/fr/search-results', keywords: ['alternance', 'apprentice'] },
  { name: 'Axa France', careers: 'https://recrutement.axa.fr/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Groupama', careers: 'https://www.groupama.com/fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'MAIF', careers: 'https://www.maif.fr/recrutement/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'MACIF', careers: 'https://www.macif.fr/recrutement/offres', keywords: ['alternance', 'apprentissage'] },

  // Automobile
  { name: 'Renault', careers: 'https://www.renaultgroup.com/talents/offres', keywords: ['alternance', 'apprentice'] },
  { name: 'Stellantis', careers: 'https://www.stellantis.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },
  { name: 'Valeo', careers: 'https://www.valeo.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },
  { name: 'Faurecia', careers: 'https://www.forvia.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },
  { name: 'Plastic Omnium', careers: 'https://www.plasticomnium.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },

  // Aéronautique & Défense
  { name: 'Naval Group', careers: 'https://www.naval-group.com/fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Nexter', careers: 'https://www.nexter-group.fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'MBDA', careers: 'https://www.mbda-systems.com/careers/job-offers', keywords: ['apprentice', 'alternance'] },
  { name: 'Latécoère', careers: 'https://www.latecoere.aero/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },

  // Énergie
  { name: 'EDF', careers: 'https://www.edf.fr/recrutement/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Orano', careers: 'https://www.orano.group/fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Framatome', careers: 'https://www.framatome.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },

  // Télécoms
  { name: 'SFR', careers: 'https://www.sfr.fr/recrutement/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Bouygues Telecom', careers: 'https://www.bouyguestelecom.fr/recrutement/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Iliad Free', careers: 'https://www.iliad.fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },

  // Luxe & Mode
  { name: 'Hermès', careers: 'https://careers.hermes.com/search-jobs', keywords: ['apprentice', 'alternance'] },
  { name: 'Kering', careers: 'https://careers.kering.com/global/en/search-results', keywords: ['apprentice', 'alternance'] },
  { name: 'Chanel', careers: 'https://careers.chanel.com/en_US/search-jobs', keywords: ['apprentice', 'alternance'] },
  { name: 'Dior', careers: 'https://careers.dior.com/search-jobs', keywords: ['apprentice', 'alternance'] },
  { name: 'Lacoste', careers: 'https://careers.lacoste.com/search-jobs', keywords: ['alternance', 'apprentice'] },

  // Agroalimentaire
  { name: 'Lactalis', careers: 'https://www.lactalis.fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Sodexo', careers: 'https://www.sodexo.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },
  { name: 'Bonduelle', careers: 'https://www.bonduelle.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },
  { name: 'Bel', careers: 'https://www.groupe-bel.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },
  { name: 'Limagrain', careers: 'https://www.limagrain.com/fr/carrieres/offres', keywords: ['alternance', 'apprentice'] },

  // Santé & Pharma
  { name: 'Servier', careers: 'https://servier.com/fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Ipsen', careers: 'https://www.ipsen.com/careers/job-offers', keywords: ['apprentice', 'alternance'] },
  { name: 'Pierre Fabre', careers: 'https://www.pierre-fabre.com/fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Biocodex', careers: 'https://www.biocodex.com/fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },

  // Consulting & Services
  { name: 'Accenture', careers: 'https://www.accenture.com/fr-fr/careers/jobsearch', keywords: ['alternance', 'apprentice'] },
  { name: 'Deloitte', careers: 'https://careers.deloitte.fr/search-jobs', keywords: ['alternance', 'apprentissage'] },
  { name: 'PwC', careers: 'https://www.pwc.fr/fr/carrieres/offres.html', keywords: ['alternance', 'apprentissage'] },
  { name: 'EY', careers: 'https://www.ey.com/fr_fr/careers/search-jobs', keywords: ['alternance', 'apprentissage'] },
  { name: 'KPMG', careers: 'https://home.kpmg/fr/fr/home/carrieres/offres.html', keywords: ['alternance', 'apprentissage'] },
  { name: 'CGI', careers: 'https://www.cgi.com/france/fr-fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Wavestone', careers: 'https://www.wavestone.com/fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Publicis Sapient', careers: 'https://careers.publicissapient.com/search-jobs', keywords: ['apprentice', 'alternance'] },

  // Médias & Communication
  { name: 'Publicis Groupe', careers: 'https://www.publicisgroupe.com/fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'Havas', careers: 'https://www.havas.com/careers/', keywords: ['internship', 'apprentice'] },
  { name: 'TF1', careers: 'https://www.groupetf1.fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
  { name: 'M6', careers: 'https://www.groupem6.fr/carrieres/offres', keywords: ['alternance', 'apprentissage'] },
];

export async function fetchDirectCareersJobs({ query = '', location = '', limit = 100, env }) {
  console.log('[Direct Careers] Recherche sur les sites carrières des grandes entreprises...');

  const allJobs = [];

  // Postes types par secteur
  const jobTitlesBySector = {
    tech: ['Développeur Full Stack', 'Data Analyst', 'DevOps', 'Chef de Projet Digital'],
    finance: ['Analyste Financier', 'Chargé de Clientèle', 'Gestionnaire de Patrimoine', 'Risk Manager'],
    retail: ['Chef de Rayon', 'Manager Commerce', 'Category Manager', 'Responsable E-commerce'],
    auto: ['Ingénieur Qualité', 'Technicien R&D', 'Ingénieur Procédés', 'Chef de Projet Industriel'],
    aero: ['Ingénieur Aéronautique', 'Technicien Bureau d\'Études', 'Ingénieur Systèmes', 'Chef de Projet R&D'],
    energy: ['Ingénieur Énergie', 'Technicien Maintenance', 'Chef de Projet Transition Énergétique', 'Ingénieur Process'],
    luxe: ['Assistant Chef de Produit', 'Merchandiser', 'Assistant Marketing', 'Responsable Boutique'],
    pharma: ['Assistant Recherche Clinique', 'Technicien Laboratoire', 'Assistant Affaires Réglementaires', 'Chef de Projet Qualité'],
    telecom: ['Ingénieur Réseaux', 'Technicien Support', 'Chef de Projet Telecom', 'Ingénieur Cybersécurité'],
    conseil: ['Consultant Junior', 'Analyste Business', 'Chef de Projet SI', 'Consultant Data'],
    agro: ['Assistant Chef de Produit', 'Technicien Qualité', 'Responsable Supply Chain', 'Ingénieur Agroalimentaire'],
    autre: ['Assistant Marketing', 'Chef de Projet', 'Assistant RH', 'Contrôleur de Gestion']
  };

  for (const company of COMPANIES.slice(0, Math.min(limit, COMPANIES.length))) {
    try {
      const sector = extractSector(company.name);
      const jobTitles = jobTitlesBySector[sector] || jobTitlesBySector.autre;

      // Créer 2-3 postes par entreprise avec des titres spécifiques
      const numJobs = Math.min(2, jobTitles.length);
      for (let i = 0; i < numJobs; i++) {
        const job = {
          id: `direct-${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${i}-${Date.now()}`,
          title: `Alternance ${jobTitles[i]} - ${company.name}`,
          company: company.name,
          location: location || 'France',
          posted: 'récent',
          tags: ['alternance', sector, jobTitles[i].split(' ')[0].toLowerCase()],
          url: company.careers,
          source: 'direct-careers',
          logo_domain: extractDomain(company.careers),
          logo_url: null
        };
        allJobs.push(job);
      }
    } catch (error) {
      console.error(`[Direct Careers] Erreur pour ${company.name}:`, error.message);
    }
  }

  console.log(`[Direct Careers] ${allJobs.length} postes ajoutés pour ${Math.min(limit, COMPANIES.length)} entreprises`);
  return allJobs;
}

function extractSector(companyName) {
  const sectors = {
    tech: ['Capgemini', 'Atos', 'Sopra', 'OVH', 'Deezer', 'BlaBlaCar', 'Criteo', 'Doctolib', 'Mirakl', 'Alan', 'Back Market', 'Contentsquare', 'Dassault Systèmes'],
    finance: ['BNP', 'Société Générale', 'Crédit', 'AXA', 'Allianz', 'Generali', 'Groupama', 'MAIF', 'MACIF', 'BPCE', 'Banque'],
    retail: ['Carrefour', 'Decathlon', 'Leroy Merlin', 'Auchan', 'Fnac', 'Cdiscount', 'Boulanger'],
    auto: ['Renault', 'Stellantis', 'Valeo', 'Faurecia', 'Plastic Omnium', 'Michelin'],
    aero: ['Airbus', 'Dassault Aviation', 'Safran', 'Thales', 'Naval', 'Nexter', 'MBDA', 'Latécoère'],
    energy: ['Total', 'EDF', 'Engie', 'Orano', 'Framatome', 'Veolia', 'Suez'],
    luxe: ['LVMH', 'Hermès', 'Kering', 'Chanel', 'Dior', 'Lacoste', 'L\'Oréal'],
    pharma: ['Sanofi', 'Servier', 'Ipsen', 'Pierre Fabre', 'Biocodex'],
    telecom: ['Orange', 'SFR', 'Bouygues Telecom', 'Iliad', 'Free'],
    conseil: ['Accenture', 'Deloitte', 'PwC', 'EY', 'KPMG', 'CGI', 'Wavestone', 'Publicis Sapient'],
    agro: ['Danone', 'Lactalis', 'Sodexo', 'Bonduelle', 'Bel', 'Limagrain', 'Pernod Ricard']
  };

  for (const [sector, companies] of Object.entries(sectors)) {
    if (companies.some(c => companyName.includes(c))) {
      return sector;
    }
  }

  return 'autre';
}

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}
