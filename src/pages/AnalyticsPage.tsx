import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, MapPin, Award, Briefcase, Clock } from 'lucide-react';

interface AnalyticsData {
  stats: {
    total: {
      total_offres: number;
      offres_enrichies: number;
      domaines_uniques: number;
      villes_uniques: number;
      avec_teletravail: number;
      avec_salaire: number;
    };
    by_domain: Array<{ domaine: string; count: number }>;
    by_level: Array<{ niveau: string; count: number }>;
    by_city: Array<{ ville: string; count: number }>;
    by_source: Array<{ source: string; count: number }>;
    by_contract_type: Array<{ type: string; count: number }>;
    telework: Array<{ category: string; count: number }>;
    top_competences: Array<{ name: string; count: number }>;
    evolution: Array<{ mois: string; count: number }>;
  };
}

export default function AnalyticsPage({ onClose }: { onClose: () => void }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Erreur : {error || 'Données non disponibles'}</p>
        </div>
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Analyse des tendances</h1>
                <p className="text-sm text-neutral-600 mt-1">Statistiques sur {stats.total.total_offres.toLocaleString()} offres d'alternance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats globales */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            icon={<Briefcase className="w-5 h-5" />}
            label="Total offres"
            value={stats.total.total_offres.toLocaleString()}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Enrichies"
            value={stats.total.offres_enrichies.toLocaleString()}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            icon={<Award className="w-5 h-5" />}
            label="Domaines"
            value={stats.total.domaines_uniques.toLocaleString()}
            color="bg-purple-50 text-purple-600"
          />
          <StatCard
            icon={<MapPin className="w-5 h-5" />}
            label="Villes"
            value={stats.total.villes_uniques.toLocaleString()}
            color="bg-orange-50 text-orange-600"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Télétravail"
            value={stats.total.avec_teletravail.toLocaleString()}
            color="bg-teal-50 text-teal-600"
          />
          <StatCard
            icon={<Briefcase className="w-5 h-5" />}
            label="Avec salaire"
            value={stats.total.avec_salaire.toLocaleString()}
            color="bg-pink-50 text-pink-600"
          />
        </div>

        {/* Grille de graphiques */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Domaines */}
          <ChartCard title="Top 10 domaines" icon={<Award className="w-5 h-5" />}>
            <BarChart
              data={stats.by_domain.slice(0, 10)}
              keyField="domaine"
              valueField="count"
              color="#2563eb"
            />
          </ChartCard>

          {/* Niveaux d'études */}
          <ChartCard title="Niveau d'études requis" icon={<Award className="w-5 h-5" />}>
            <BarChart
              data={stats.by_level}
              keyField="niveau"
              valueField="count"
              color="#16a34a"
            />
          </ChartCard>

          {/* Top villes */}
          <ChartCard title="Top 10 villes" icon={<MapPin className="w-5 h-5" />}>
            <BarChart
              data={stats.by_city.slice(0, 10)}
              keyField="ville"
              valueField="count"
              color="#9333ea"
            />
          </ChartCard>

          {/* Type de contrat */}
          <ChartCard title="Type de contrat" icon={<Briefcase className="w-5 h-5" />}>
            <BarChart
              data={stats.by_contract_type}
              keyField="type"
              valueField="count"
              color="#ea580c"
            />
          </ChartCard>

          {/* Compétences */}
          <ChartCard title="Top 15 compétences demandées" icon={<TrendingUp className="w-5 h-5" />} fullWidth>
            <BarChart
              data={stats.top_competences.slice(0, 15)}
              keyField="name"
              valueField="count"
              color="#0891b2"
            />
          </ChartCard>

          {/* Sources */}
          <ChartCard title="Sources des offres" icon={<BarChart3 className="w-5 h-5" />}>
            <BarChart
              data={stats.by_source}
              keyField="source"
              valueField="count"
              color="#dc2626"
            />
          </ChartCard>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${color} mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-neutral-900">{value}</div>
      <div className="text-sm text-neutral-600">{label}</div>
    </div>
  );
}

function ChartCard({ title, icon, children, fullWidth = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-neutral-200 p-6 ${fullWidth ? 'lg:col-span-2' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="text-blue-600">{icon}</div>
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function BarChart({ data, keyField, valueField, color }: { data: any[]; keyField: string; valueField: string; color: string }) {
  if (!data || data.length === 0) {
    return <p className="text-neutral-500 text-sm">Aucune donnée</p>;
  }

  const maxValue = Math.max(...data.map(item => item[valueField]));

  return (
    <div className="space-y-3">
      {data.map((item, idx) => {
        const percentage = (item[valueField] / maxValue) * 100;
        return (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-32 text-sm text-neutral-700 truncate" title={item[keyField]}>
              {item[keyField] || 'Non spécifié'}
            </div>
            <div className="flex-1">
              <div className="h-8 bg-neutral-100 rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color
                  }}
                />
                <span className="absolute inset-0 flex items-center px-3 text-sm font-medium text-neutral-700">
                  {item[valueField].toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
