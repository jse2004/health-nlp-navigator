import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Clock } from 'lucide-react';
import medicalExam from '@/assets/medical-exam.png';
import medicalConsultation from '@/assets/medical-consultation.png';
import medicalInfirmary from '@/assets/medical-infirmary.png';
import dentalConsultation from '@/assets/dental-consultation.png';
import dentalProphylaxis from '@/assets/dental-prophylaxis.png';
import dentalTreatment from '@/assets/dental-treatment.png';

const HomePage = () => {
  const navigate = useNavigate();

  const medicalServices = [
    { name: 'Annual Physical Exam', image: medicalExam },
    { name: 'Consultation with School Physician', image: medicalConsultation },
    { name: 'Infirmary Care', image: medicalInfirmary },
  ];

  const dentalServices = [
    { name: 'Consultation', image: dentalConsultation },
    { name: 'Annual Oral Prophylaxis', image: dentalProphylaxis },
    { name: 'Minor Treatment at School Clinic', image: dentalTreatment },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      {/* Header with Sign In Button */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/udm-logo.png" alt="UDM Logo" className="h-12 w-12 object-contain" />
            <img src="/udm_clinic.png" alt="UDM Clinic" className="h-12 w-12 object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-medical-primary to-blue-600 hover:from-medical-primary/90 hover:to-blue-600/90 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Organizational Chart Section */}
        <section className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100 tracking-tight">
            UDM CLINIC ORGANIZATIONAL CHART
          </h1>
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            <img 
              src="/udm_orgchart.png" 
              alt="UDM Clinic Organizational Chart" 
              className="w-full h-auto object-contain rounded-xl"
            />
          </div>
        </section>

        {/* Services Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
            Services Offered
          </h2>

          {/* Medical Services */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-center mb-8 text-medical-primary dark:text-blue-400">
              Medical Services
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
              {medicalServices.map((service, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg mb-4 ring-4 ring-medical-primary/20">
                    <img 
                      src={service.image} 
                      alt={service.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{service.name}</p>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-medical-primary mr-2">•</span>
                  Over-the-counter medications
                </li>
                <li className="flex items-start">
                  <span className="text-medical-primary mr-2">•</span>
                  Health seminars
                </li>
              </ul>
            </div>
          </div>

          {/* Dental Services */}
          <div>
            <h3 className="text-2xl font-semibold text-center mb-8 text-cyan-600 dark:text-cyan-400">
              Dental Services
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
              {dentalServices.map((service, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden shadow-lg mb-4 ring-4 ring-cyan-600/20">
                    <img 
                      src={service.image} 
                      alt={service.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">{service.name}</p>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-cyan-600 mr-2">•</span>
                  Over-the-counter medications
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-600 mr-2">•</span>
                  Tooth extraction
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-600 mr-2">•</span>
                  Dental seminars
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Schedule Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-medical-primary to-blue-600 rounded-3xl shadow-2xl p-10 text-white">
            <div className="flex items-center justify-center gap-3 mb-8">
              <Clock className="w-8 h-8" />
              <h2 className="text-3xl font-bold text-center">
                University Health Service Schedule
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Main Building */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-semibold mb-4 text-center">Main Building</h3>
                <div className="space-y-3 text-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Monday - Saturday:</span>
                    <span className="font-bold">6:30 AM – 8:30 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Sunday:</span>
                    <span className="font-bold">8:00 AM – 5:00 PM</span>
                  </div>
                </div>
              </div>

              {/* Annex */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-semibold mb-4 text-center">Annex</h3>
                <div className="space-y-3 text-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Monday - Saturday:</span>
                    <span className="font-bold">6:30 AM – 8:30 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Sunday:</span>
                    <span className="font-bold">8:00 AM – 5:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="container mx-auto px-6 text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm">© 2025 UDM Clinic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
