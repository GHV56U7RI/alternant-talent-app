BEGIN TRANSACTION;
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('dataiku-alternant-e-data-analyst-x0j4','Alternant·e Data Analyst','Dataiku','Paris (hybride)','aujourd''hui',
   strftime('%s','now'),'https://careers.dataiku.com/','["Data","Alternance","Bac+3/5"]','alternance','alternance',
   'seed','dataiku.com','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('back-market-alternant-e-d-veloppeur-front-end-bjl5','Alternant·e Développeur Front-End','Back Market','Paris / Remote FR','récent',
   strftime('%s','now','-1 day'),'https://jobs.backmarket.com/','["Engineering","Frontend","Alternance","Remote"]','alternance','alternance',
   'seed','backmarket.fr','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('doctolib-assistant-data-alternance--d9r2','Assistant Data (Alternance)','Doctolib','Paris','cette semaine',
   strftime('%s','now','-3 days'),'https://careers.doctolib.com/','["Data","Santé","Alternance"]','alternance','alternance',
   'seed','doctolib.com','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('blablacar-data-analyst-junior-alt--gbnt','Data Analyst Junior (Alt.)','BlaBlaCar','Paris / Remote FR','nouveau',
   strftime('%s','now'),'https://jobs.blablacar.com/','["Data","Transport","Alternance","Remote"]','alternance','alternance',
   'seed','blablacar.com','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('back-market-growth-marketing-alt--5p31','Growth Marketing (Alt.)','Back Market','Paris','aujourd''hui',
   strftime('%s','now'),'https://jobs.backmarket.com/','["Growth","Marketing","Alternance"]','alternance','alternance',
   'seed','backmarket.fr','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('qonto-devops-alt--isjr','DevOps (Alt.)','Qonto','Paris','récent',
   strftime('%s','now','-2 days'),'https://jobs.lever.co/qonto','["DevOps","Cloud","Alternance"]','alternance','alternance',
   'seed','qonto.com','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('qonto-finance-ops-alt--tddc','Finance Ops (Alt.)','Qonto','Paris','récent',
   strftime('%s','now','-2 days'),'https://jobs.lever.co/qonto','["Finance","Ops","Alternance"]','alternance','alternance',
   'seed','qonto.com','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('alan-customer-care-alt--uqyk','Customer Care (Alt.)','Alan','Paris (hybride)','cette semaine',
   strftime('%s','now','-4 days'),'https://jobs.alan.com/','["Support","Santé","Alternance"]','alternance','alternance',
   'seed','alan.com','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('dataiku-dataviz-alt--lpr4','DataViz (Alt.)','Dataiku','Paris (hybride)','récent',
   strftime('%s','now','-1 day'),'https://careers.dataiku.com/','["Data","Viz","Alternance"]','alternance','alternance',
   'seed','dataiku.com','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('doctolib-assistant-produit-alt--ps2f','Assistant Produit (Alt.)','Doctolib','Paris','cette semaine',
   strftime('%s','now','-3 days'),'https://careers.doctolib.com/','["Product","Santé","Alternance"]','alternance','alternance',
   'seed','doctolib.com','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('back-market-backend-node-alt--em2p','Backend Node (Alt.)','Back Market','Paris','récent',
   strftime('%s','now','-1 day'),'https://jobs.backmarket.com/','["Engineering","Backend","Alternance"]','alternance','alternance',
   'seed','backmarket.fr','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('blablacar-ux-research-alt--4g54','UX Research (Alt.)','BlaBlaCar','Paris / Remote FR','nouveau',
   strftime('%s','now'),'https://jobs.blablacar.com/','["UX","Research","Alternance","Remote"]','alternance','alternance',
   'seed','blablacar.com','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('alan-assistant-rh-alt--7ekq','Assistant RH (Alt.)','Alan','Paris','cette semaine',
   strftime('%s','now','-5 days'),'https://jobs.alan.com/','["RH","People","Alternance"]','alternance','alternance',
   'seed','alan.com','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('dataiku-alternant-e-data-engineer-u1qe','Alternant·e Data Engineer','Dataiku','Paris (hybride)','récent',
   strftime('%s','now','-1 day'),'https://careers.dataiku.com/','["Data","Engineering","Alternance"]','alternance','alternance',
   'seed','dataiku.com','');
INSERT OR REPLACE INTO jobs
  (id,title,company,location,posted,posted_at,url,tags,type,contract,source,logo_domain,logo_url)
  VALUES
  ('back-market-ops-support-alt--4g3e','Ops Support (Alt.)','Back Market','Paris','récent',
   strftime('%s','now','-2 days'),'https://jobs.backmarket.com/','["Ops","Support","Alternance"]','alternance','alternance',
   'seed','backmarket.fr','');
COMMIT;
