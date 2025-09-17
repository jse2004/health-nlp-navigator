import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, FileText, Stamp, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface MedicalCertificateData {
  id: string;
  patient_name: string;
  certificate_number: string;
  issue_date: string;
  valid_until?: string;
  reason: string;
  recommendations?: string;
  doctor_name: string;
}

interface MedicalCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  certificateData: MedicalCertificateData;
}

const MedicalCertificate: React.FC<MedicalCertificateProps> = ({
  isOpen,
  onClose,
  certificateData
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadCertificateAsPDF = async () => {
    if (!certificateRef.current) return;

    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Medical_Certificate_${certificateData.certificate_number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const downloadCertificate = () => {
    // Create certificate content
    const certificateContent = `
════════════════════════════════════════════════════
                    MEDICAL CERTIFICATE
════════════════════════════════════════════════════

                      UDM CARE CLINIC
                 University Health Services
              123 University Avenue, City, State
                    Phone: (555) 123-4567

────────────────────────────────────────────────────

Certificate No: ${certificateData.certificate_number}
Issue Date: ${new Date(certificateData.issue_date).toLocaleDateString()}
${certificateData.valid_until ? `Valid Until: ${new Date(certificateData.valid_until).toLocaleDateString()}` : ''}

────────────────────────────────────────────────────

TO WHOM IT MAY CONCERN:

This is to certify that:

Patient Name: ${certificateData.patient_name}

Has visited our clinic on ${new Date(certificateData.issue_date).toLocaleDateString()} and was examined by our medical staff.

Medical Reason: ${certificateData.reason}

${certificateData.recommendations ? `\nRecommendations: ${certificateData.recommendations}` : ''}

This certificate is issued to excuse the above-named patient from 
classes/work activities as medically necessary.

────────────────────────────────────────────────────

Attending Physician: ${certificateData.doctor_name}
Medical License: ML-12345-2024
Digital Signature: [VERIFIED]

Date of Issue: ${new Date(certificateData.issue_date).toLocaleDateString()}

────────────────────────────────────────────────────
                    OFFICIAL SEAL
              UDM CARE CLINIC - VERIFIED
────────────────────────────────────────────────────

This is an official medical certificate issued by UDM Care Clinic.
For verification, please contact: verify@udmcare.edu

════════════════════════════════════════════════════
    `;

    // Create and download the file
    const blob = new Blob([certificateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Medical_Certificate_${certificateData.certificate_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Medical Certificate
          </DialogTitle>
        </DialogHeader>
        
        <div ref={certificateRef} className="space-y-6 bg-background p-6 rounded-lg">
          {/* Certificate Header */}
          <div className="text-center border-b-2 border-primary pb-4">
            <div className="bg-primary/10 rounded-lg p-4 mb-4">
              <h1 className="text-2xl font-bold text-primary">MEDICAL CERTIFICATE</h1>
              <p className="text-sm text-muted-foreground mt-1">UDM CARE CLINIC</p>
              <p className="text-xs text-muted-foreground">University Health Services</p>
            </div>
            
            <div className="flex justify-between text-sm">
              <span><strong>Certificate No:</strong> {certificateData.certificate_number}</span>
              <span><strong>Date:</strong> {new Date(certificateData.issue_date).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="space-y-4">
            <div className="bg-card rounded-lg p-4 border">
              <h3 className="font-semibold mb-2">TO WHOM IT MAY CONCERN:</h3>
              <p className="text-sm leading-relaxed">
                This is to certify that <strong>{certificateData.patient_name}</strong> has visited 
                our clinic on <strong>{new Date(certificateData.issue_date).toLocaleDateString()}</strong> and 
                was examined by our medical staff.
              </p>
            </div>

            <div className="bg-card rounded-lg p-4 border">
              <h4 className="font-semibold mb-2">Medical Reason:</h4>
              <p className="text-sm">{certificateData.reason}</p>
            </div>

            {certificateData.recommendations && (
              <div className="bg-card rounded-lg p-4 border">
                <h4 className="font-semibold mb-2">Medical Recommendations:</h4>
                <p className="text-sm">{certificateData.recommendations}</p>
              </div>
            )}

            <div className="bg-card rounded-lg p-4 border">
              <p className="text-sm leading-relaxed">
                This certificate is issued to excuse the above-named patient from 
                classes/work activities as medically necessary.
              </p>
            </div>
          </div>

          {/* Certificate Footer */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Attending Physician:</strong> {certificateData.doctor_name}</p>
                <p><strong>Medical License:</strong> ML-12345-2024</p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 mb-2">
                  <Stamp className="h-4 w-4 text-primary" />
                  <span className="text-xs text-primary font-semibold">OFFICIAL SEAL</span>
                </div>
                <p className="text-xs text-muted-foreground">UDM CARE CLINIC - VERIFIED</p>
              </div>
            </div>
            
            {certificateData.valid_until && (
              <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  <strong>Valid Until:</strong> {new Date(certificateData.valid_until).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Verification Notice */}
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">
              This is an official medical certificate issued by UDM Care Clinic.<br />
              For verification, please contact: <strong>verify@udmcare.edu</strong>
            </p>
          </div>

          {/* Download Buttons */}
          <div className="flex justify-center gap-3 pt-4">
            <Button onClick={downloadCertificateAsPDF} className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={downloadCertificate} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Text
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicalCertificate;