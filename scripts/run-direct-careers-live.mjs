
import { fetchDirectCareersJobs } from '../sources/direct-careers.js';

async function run() {
    console.log('🚀 Démarrage du test live de Direct Careers...');

    const env = {
        OLLAMA_ENDPOINT: 'http://localhost:11434',
        // Add other env vars if needed, e.g. keys if available
        // GEMINI_API_KEY: process.env.GEMINI_API_KEY
    };

    try {
        const start = Date.now();
        const results = await fetchDirectCareersJobs({
            query: 'alternance',
            location: 'France',
            limit: 200, // Augmenté à 200 pour avoir plus d'offres
            env
        });
        const duration = (Date.now() - start) / 1000;

        console.log('\n✅ Collecte terminée !');
        console.log(`⏱️  Durée: ${duration.toFixed(2)}s`);
        console.log(`📦 Offres récupérées: ${results.length}`);

        if (results.meta) {
            console.log('\n📊 Métriques:');
            console.log(JSON.stringify(results.meta, null, 2));
        }

        console.log('\n📝 Toutes les offres collectées:');
        results.forEach((job, index) => {
            console.log(`\n${index + 1}. [${job.company}] ${job.title}`);
            console.log(`   📍 ${job.location}`);
            console.log(`   🔗 ${job.apply_url}`);
            console.log(`   🏷️  Tags: ${job.tags?.join(', ') || 'N/A'}`);
            console.log(`   📅 Publié: ${new Date(job.posted).toLocaleDateString('fr-FR')}`);
            console.log(`   🤖 AI: ${job.__ai_validation?.tier} - ${job.__ai_validation?.verdict} (confiance: ${job.__ai_validation?.confidence})`)
        });
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

run();
