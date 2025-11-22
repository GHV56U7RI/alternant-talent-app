import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { URL } from 'url';

const TARGET_URL = process.argv[2];

if (!TARGET_URL) {
  console.error('Usage: node scripts/discover-ats.mjs <URL>');
  process.exit(1);
}

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function analyze(url) {
  console.log(`Analyzing ${url}...`);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow'
    });

    const html = await res.text();
    const finalUrl = res.url;
    console.log(`Resolved URL: ${finalUrl}`);

    const $ = cheerio.load(html);
    let detected = [];

    // 1. Check for Meteojob / CleverConnect (Fibonacci)
    if ($('#fibonacci-state').length > 0 || html.includes('fibonacci-state')) {
      detected.push({
        type: 'meteojob',
        confidence: 'high',
        details: 'Found #fibonacci-state script'
      });
    }

    // 2. Check for SmartRecruiters
    if (html.includes('smartrecruiters.com')) {
      const match = html.match(/jobs\.smartrecruiters\.com\/([a-zA-Z0-9]+)/) || html.match(/api\.smartrecruiters\.com\/v1\/companies\/([a-zA-Z0-9]+)/);
      detected.push({
        type: 'smartrecruiters',
        confidence: 'medium',
        details: match ? `Company ID: ${match[1]}` : 'Found smartrecruiters.com links'
      });
    }

    // 3. Check for Workday
    if (html.includes('myworkdayjobs.com')) {
      const match = html.match(/([a-zA-Z0-9-]+)\.myworkdayjobs\.com\/([a-zA-Z0-9]+)/);
      if (match) {
        detected.push({
          type: 'workday',
          confidence: 'high',
          details: `Host: ${match[1]}.myworkdayjobs.com, Tenant: ${match[2]}`
        });
      } else {
        detected.push({ type: 'workday', confidence: 'medium', details: 'Found myworkdayjobs.com links' });
      }
    }

    // 4. Check for Greenhouse
    if (html.includes('greenhouse.io')) {
      const match = html.match(/boards\.greenhouse\.io\/([a-zA-Z0-9]+)/);
      detected.push({
        type: 'greenhouse',
        confidence: 'high',
        details: match ? `Board: ${match[1]}` : 'Found greenhouse.io links'
      });
    }

    // 5. Check for Lever
    if (html.includes('lever.co')) {
      const match = html.match(/jobs\.lever\.co\/([a-zA-Z0-9-]+)/);
      detected.push({
        type: 'lever',
        confidence: 'high',
        details: match ? `Company: ${match[1]}` : 'Found lever.co links'
      });
    }

    if (detected.length === 0) {
      console.log('No known ATS detected directly.');
      // Try scanning links
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        if (href.includes('myworkdayjobs.com')) console.log(`Found link: ${href}`);
        if (href.includes('smartrecruiters.com')) console.log(`Found link: ${href}`);
        if (href.includes('greenhouse.io')) console.log(`Found link: ${href}`);
        if (href.includes('lever.co')) console.log(`Found link: ${href}`);
        if (href.includes('welcomekit.co')) console.log(`Found link: ${href}`);
      });
    } else {
      console.log('Detected ATS:', JSON.stringify(detected, null, 2));

      // Suggest Config
      const companyName = $('title').text().trim() || 'Unknown Company';
      console.log('\nSuggested Config for direct-careers.js:');

      detected.forEach(d => {
        if (d.type === 'meteojob') {
          console.log(`{ name: '${companyName}', careers: '${finalUrl}', meteojob: { url: '${finalUrl}' } },`);
        }
        if (d.type === 'workday' && d.details.includes('Host')) {
           // naive parse
           const host = d.details.split('Host: ')[1].split(',')[0];
           const tenant = d.details.split('Tenant: ')[1];
           console.log(`{ name: '${companyName}', careers: '${finalUrl}', workday: { host: '${host}', tenant: '${tenant}' } },`);
        }
        // Add others...
      });
    }

  } catch (e) {
    console.error('Error:', e.message);
  }
}

analyze(TARGET_URL);
