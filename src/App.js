import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Appel API pour récupérer les offres d'emploi
        axios.get('https://api.apprentissage.beta.gouv.fr/api/job/v1/search?latitude=48.8566&longitude=2.3522&radius=30&romes=M1805,M1802&caller=alternant-talent.app', {
            headers: {
                'Authorization': 'Bearer YOUR_API_KEY'
            }
        })
        .then(response => {
            setJobs(response.data.jobs); // Mise à jour de l'état avec les données des offres
            setLoading(false); // Fin du chargement
        })
        .catch(error => {
            setError('Erreur de chargement des annonces');
            setLoading(false); // Fin du chargement avec erreur
        });
    }, []);

    if (loading) return <div>Chargement des offres...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h1>Offres d'emploi</h1>
            <ul>
                {jobs.map((job, index) => (
                    <li key={index}>
                        <h2>{job.offer.title}</h2>
                        <p>{job.offer.description}</p>
                        <a href={job.apply.url} target="_blank" rel="noopener noreferrer">Postuler</a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;

