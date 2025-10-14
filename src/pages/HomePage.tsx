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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 dark:from-background dark:via-muted/5 dark:to-primary/5 transition-colors">
      {/* Header with Sign In Button */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/udm-logo.png" alt="UDM Logo" className="h-14 w-14 object-contain hover:scale-110 transition-transform duration-300" />
            <img src="/udm_clinic.png" alt="UDM Clinic" className="h-14 w-14 object-contain hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
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
          <div className="text-center mb-8 space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient">
              UDM CLINIC
            </h1>
            <p className="text-xl md:text-2xl font-semibold text-muted-foreground">
              Organizational Chart
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-card via-card to-muted/20 rounded-3xl shadow-2xl p-8 border border-border backdrop-blur-sm relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -z-10" />
            
            {/* Logos Header */}
            <div className="flex justify-center items-center gap-8 mb-8 pb-6 border-b border-border">
              <div className="group relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-colors" />
                <img 
                  src="/udm-logo.png" 
                  alt="UDM Logo" 
                  className="h-20 w-20 object-contain relative z-10 group-hover:scale-110 transition-transform duration-300" 
                />
              </div>
              <div className="h-16 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
              <div className="group relative">
                <div className="absolute inset-0 bg-secondary/20 rounded-full blur-xl group-hover:bg-secondary/30 transition-colors" />
                <img 
                  src="/udm_clinic.png" 
                  alt="UDM Clinic" 
                  className="h-20 w-20 object-contain relative z-10 group-hover:scale-110 transition-transform duration-300" 
                />
              </div>
            </div>
            
            {/* Organizational Chart Image */}
            <div className="rounded-xl overflow-hidden shadow-inner">
              <img 
                src="/udm_orgchart.png" 
                alt="UDM Clinic Organizational Chart" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="mb-16">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Services Offered
            </h2>
            <p className="text-muted-foreground">Comprehensive healthcare for our community</p>
          </div>

          {/* Medical Services */}
          <div className="mb-12">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary" />
              <h3 className="text-2xl font-semibold text-primary">
                Medical Services
              </h3>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
              {medicalServices.map((service, index) => (
                <div key={index} className="group flex flex-col items-center text-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-lg mb-4 ring-4 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 group-hover:scale-110">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img 
                      src={service.image} 
                      alt={service.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-medium text-foreground group-hover:text-primary transition-colors">{service.name}</p>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl transition-shadow">
              <ul className="space-y-3 text-card-foreground">
                <li className="flex items-start group">
                  <span className="text-primary mr-3 font-bold group-hover:scale-125 transition-transform">•</span>
                  <span className="group-hover:text-primary transition-colors">Over-the-counter medications</span>
                </li>
                <li className="flex items-start group">
                  <span className="text-primary mr-3 font-bold group-hover:scale-125 transition-transform">•</span>
                  <span className="group-hover:text-primary transition-colors">Health seminars</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Dental Services */}
          <div>
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-secondary" />
              <h3 className="text-2xl font-semibold text-secondary">
                Dental Services
              </h3>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-secondary" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
              {dentalServices.map((service, index) => (
                <div key={index} className="group flex flex-col items-center text-center">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-lg mb-4 ring-4 ring-secondary/20 group-hover:ring-secondary/40 transition-all duration-300 group-hover:scale-110">
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img 
                      src={service.image} 
                      alt={service.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-medium text-foreground group-hover:text-secondary transition-colors">{service.name}</p>
                </div>
              ))}
            </div>
            <div className="bg-card rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl transition-shadow">
              <ul className="space-y-3 text-card-foreground">
                <li className="flex items-start group">
                  <span className="text-secondary mr-3 font-bold group-hover:scale-125 transition-transform">•</span>
                  <span className="group-hover:text-secondary transition-colors">Over-the-counter medications</span>
                </li>
                <li className="flex items-start group">
                  <span className="text-secondary mr-3 font-bold group-hover:scale-125 transition-transform">•</span>
                  <span className="group-hover:text-secondary transition-colors">Tooth extraction</span>
                </li>
                <li className="flex items-start group">
                  <span className="text-secondary mr-3 font-bold group-hover:scale-125 transition-transform">•</span>
                  <span className="group-hover:text-secondary transition-colors">Dental seminars</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Schedule Section */}
        <section className="mb-12">
          <div className="relative bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-3xl shadow-2xl p-10 text-primary-foreground overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-8">
                <Clock className="w-10 h-10 animate-pulse" />
                <h2 className="text-3xl md:text-4xl font-bold text-center">
                  University Health Service Schedule
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Main Building */}
                <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105">
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
                <div className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105">
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
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 backdrop-blur-sm border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p className="text-sm">© 2025 UDM Clinic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
