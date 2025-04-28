"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheck,
  FaCalendarAlt,
  FaClock,
  FaGlobe,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaUser,
  FaCog,
  FaShoppingCart,
  FaPalette,
  FaSearch,
  FaFile,
  FaFileInvoice,
  FaPaintBrush,
  FaFolder,
  FaFileUpload,
  FaCheckCircle,
  FaTimesCircle,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaVideo,
  FaVideoSlash,
} from "react-icons/fa";
import { SiGooglemeet, SiZoom } from "react-icons/si";
import emailjs from "@emailjs/browser";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

interface Step {
  id: number;
  title: string;
  icon: React.ElementType;
}

interface ServiceType {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Date du Rendez-vous",
    icon: FaCalendarAlt,
  },
  {
    id: 2,
    title: "Informations Client",
    icon: FaUser,
  },
  {
    id: 3,
    title: "Services Souhaités",
    icon: FaCog,
  },
  {
    id: 4,
    title: "Description Projet",
    icon: FaFileInvoice,
  },
  {
    id: 5,
    title: "Documents",
    icon: FaFolder,
  },
];

const serviceTypes: ServiceType[] = [
  {
    id: "web-design",
    name: "Web Design",
    description: "Création de sites web modernes et responsifs",
    icon: FaPalette,
  },
  {
    id: "development",
    name: "Développement",
    description: "Développement d'applications web sur mesure",
    icon: FaCog,
  },
  {
    id: "seo",
    name: "SEO",
    description: "Optimisation pour les moteurs de recherche",
    icon: FaSearch,
  },
  {
    id: "branding",
    name: "Branding",
    description: "Création d'identité visuelle et de logo",
    icon: FaPaintBrush,
  },
];

const timeSlots = [
  "09h00",
  "09h30",
  "10h00",
  "10h30",
  "11h00",
  "11h30",
  "14h00",
  "14h30",
  "15h00",
  "15h30",
];

interface FileWithPreview extends File {
  preview?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  message: string;
  selectedServices: string[];
  files: FileWithPreview[];
  meetingPlatform?: "zoom" | "meet" | null;
}

const Contact = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    message: "",
    selectedServices: [],
    files: [],
    meetingPlatform: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [projectType, setProjectType] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [totalProgress, setTotalProgress] = useState<number>(0);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [dateQuotaReached, setDateQuotaReached] = useState<boolean>(false);
  const [dateCheckLoading, setDateCheckLoading] = useState<boolean>(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const handleDateSelect = async (dateString: string) => {
    setSelectedDate(dateString);
    setDateCheckLoading(true);
    setDateQuotaReached(false);
    try {
      const start = Date.now();
      const res = await fetch(
        `/api/check-date?date=${encodeURIComponent(dateString)}`
      );
      const data = await res.json();
      const elapsed = Date.now() - start;
      const minDelay = 1000; // 1 seconde
      if (elapsed < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - elapsed));
      }
      if (data.count >= 5) {
        setDateQuotaReached(true);
      } else {
        setDateQuotaReached(false);
      }
    } catch (e) {
      setDateQuotaReached(false);
    } finally {
      setDateCheckLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-12" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate === date.toDateString();
      const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

      days.push(
        <button
          key={day}
          onClick={() => !isPast && handleDateSelect(date.toDateString())}
          disabled={isPast}
          className={`h-12 rounded-lg flex items-center justify-center text-black ${
            isSelected
              ? "bg-purple text-white"
              : isToday
              ? "bg-white/90"
              : "bg-white hover:bg-white/90"
          } ${isPast ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.setMonth(currentMonth.getMonth() + 1))
    );
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.setMonth(currentMonth.getMonth() - 1))
    );
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return Boolean(selectedDate);
      case 2:
        return Boolean(
          formData.firstName &&
            formData.lastName &&
            formData.email &&
            formData.phone
        );
      case 3:
        return formData.selectedServices.length > 0;
      case 4:
        return Boolean(projectDescription);
      case 5:
        return true; // Les fichiers sont optionnels
      default:
        return true;
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      message: "",
      selectedServices: [],
      files: [],
      meetingPlatform: null,
    });
    setSelectedDate("");
    setProjectDescription("");
    setBudget("");
    setDeadline("");
    setShowSuccess(false);
    setShowError(false);
    setErrorMessage("");
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simuler un temps de chargement initial
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Préparer les données à envoyer
      const emailData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        projectDescription: projectDescription,
        serviceTypes: formData.selectedServices,
        budget: budget || "Non spécifié",
        deadline: deadline || "Non spécifié",
        selectedDate: selectedDate,
        meetingPlatform: formData.meetingPlatform,
        files: formData.files.map((file) => ({
          name: file.name,
          content: file.preview,
          type: file.type,
        })),
      };

      // Envoyer les données à l'API
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi de l'email");
      }

      // Marquer la dernière étape comme complétée
      if (!completedSteps.includes(5)) {
        setCompletedSteps([...completedSteps, 5]);
      }

      setShowSuccess(true);
      setShowError(false);
      setErrorMessage("");

      // Supprimer la redirection automatique ici
      // setTimeout(() => {
      //   resetForm();
      //   router.push("/");
      // }, 5000);
    } catch (error) {
      console.error("Error sending email:", error);
      setShowError(true);
      setErrorMessage(
        "Une erreur est survenue lors de l'envoi du message. Veuillez réessayer."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Marquer l'étape actuelle comme complétée
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }

      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit(new Event("submit") as any);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FaFileImage className="text-blue-400" />;
      case "pdf":
        return <FaFilePdf className="text-red-400" />;
      case "doc":
      case "docx":
        return <FaFileWord className="text-blue-600" />;
      case "xls":
      case "xlsx":
        return <FaFileExcel className="text-green-600" />;
      default:
        return <FaFile className="text-purple" />;
    }
  };

  const calculateTotalProgress = (
    currentStep: number,
    completedSteps: number[],
    uploadProgress: { [key: string]: number }
  ) => {
    // Calcul de base (80% pour les étapes principales)
    const baseProgress = (currentStep / 5) * 80;

    // Calcul pour l'upload (20% restants)
    let uploadContribution = 0;
    if (Object.keys(uploadProgress).length > 0) {
      const avgUploadProgress =
        Object.values(uploadProgress).reduce((a, b) => a + b, 0) /
        Object.keys(uploadProgress).length;
      uploadContribution = (avgUploadProgress / 100) * 20;
    } else if (currentStep === 5) {
      // Si on est à l'étape 5 mais sans fichiers (optionnel), on donne quand même les 20%
      uploadContribution = 20;
    }

    return Math.min(Math.round(baseProgress + uploadContribution), 100);
  };

  // Progression rapide mais fluide
  const animateTo100 = (fileName: string, from: number, done: () => void) => {
    let progress = from;
    const duration = 300; // ms
    const steps = 20;
    const increment = (100 - from) / steps;
    let currentStep = 0;
    const interval = setInterval(() => {
      progress += increment;
      currentStep++;
      setUploadProgress((prev) => ({
        ...prev,
        [fileName]: Math.floor(progress),
      }));
      if (currentStep >= steps) {
        clearInterval(interval);
        setUploadProgress((prev) => ({ ...prev, [fileName]: 100 }));
        done();
      }
    }, duration / steps);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files) as FileWithPreview[];
      Promise.all(
        fileList.map(
          (file) =>
            new Promise<FileWithPreview>((resolve) => {
              setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
              const reader = new FileReader();
              reader.onload = (event) => {
                file.preview = event.target?.result as string;
                // Animation fluide jusqu'à 100%
                animateTo100(file.name, uploadProgress[file.name] || 0, () =>
                  resolve(file)
                );
              };
              reader.readAsDataURL(file);
            })
        )
      ).then((filesWithPreview) => {
        setFormData((prevData) => ({ ...prevData, files: filesWithPreview }));
      });
    }
  };

  // Mettre à jour la progression totale quand l'étape change
  useEffect(() => {
    setTotalProgress(
      calculateTotalProgress(currentStep, completedSteps, uploadProgress)
    );
  }, [currentStep, completedSteps, uploadProgress]);

  const getStepStatus = (step: number) => {
    if (completedSteps.includes(step)) return "completed";
    if (step === currentStep) return "current";
    return "pending";
  };

  // Ajouter un console.log pour déboguer
  console.log("Current state:", {
    currentStep,
    showSuccess,
    isLoading,
    completedSteps,
  });

  const handleCancelProject = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    router.push("/");
  };

  // Dans la partie CSS globale (ajoutez ces classes dans votre fichier CSS global)
  const styles = `
    .fade-content {
      transition: opacity 0.5s ease-in-out;
    }

    .fade-out {
      opacity: 0;
    }
  `;

  const renderMeetingPlatforms = () => (
    <div className="mt-8">
      <h3 className="text-white font-medium mb-4">
        Choisissez une plateforme de réunion (optionnel)
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              meetingPlatform: prev.meetingPlatform === "zoom" ? null : "zoom",
            }))
          }
          className={`p-4 rounded-xl border transition-all flex items-center gap-4 ${
            formData.meetingPlatform === "zoom"
              ? "border-purple bg-purple/10"
              : "border-white/10 hover:border-purple/50"
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <SiZoom className="text-2xl text-blue-500" />
          </div>
          <div className="text-left">
            <h4 className="text-white font-medium">Zoom</h4>
            <p className="text-white/60 text-sm">
              Réunion vidéo HD (optionnel)
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              meetingPlatform: prev.meetingPlatform === "meet" ? null : "meet",
            }))
          }
          className={`p-4 rounded-xl border transition-all flex items-center gap-4 ${
            formData.meetingPlatform === "meet"
              ? "border-purple bg-purple/10"
              : "border-white/10 hover:border-purple/50"
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <SiGooglemeet className="text-2xl text-green-500" />
          </div>
          <div className="text-left">
            <h4 className="text-white font-medium">Google Meet</h4>
            <p className="text-white/60 text-sm">
              Réunion via Google (optionnel)
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  // Drag & Drop pour l'upload de fichiers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files) as FileWithPreview[];
      Promise.all(
        fileList.map(
          (file) =>
            new Promise<FileWithPreview>((resolve) => {
              setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
              const reader = new FileReader();
              reader.onload = (event) => {
                file.preview = event.target?.result as string;
                animateTo100(file.name, uploadProgress[file.name] || 0, () =>
                  resolve(file)
                );
              };
              reader.readAsDataURL(file);
            })
        )
      ).then((filesWithPreview) => {
        setFormData((prevData) => ({
          ...prevData,
          files: [...prevData.files, ...filesWithPreview],
        }));
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };
  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  if (showSuccess) {
    return (
      <>
        <style jsx global>
          {styles}
        </style>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-b from-[#1c1c22] to-[#27272c] flex items-center justify-center p-4">
          <div className="w-full max-w-4xl mx-auto bg-[#27272c]/50 backdrop-blur-sm rounded-3xl p-8 border border-white/5">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold text-white">15%</span>
                <span className="text-white/60">En cours</span>
              </div>
              <button className="text-white/60 hover:text-white flex items-center gap-2 transition-colors">
                <FaTimes />
                <span>Annuler le projet</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-12">
              {/* Timeline côté gauche */}
              <div className="space-y-8 relative">
                {/* Ligne verticale */}
                <div className="absolute left-3 top-4 bottom-4 w-0.5 bg-white/10" />

                {/* Étape 1 - Soumission du projet */}
                <div className="relative flex gap-6">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center z-10">
                    <FaCheck className="text-white text-sm" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">
                      Soumission du projet
                    </h3>
                    <p className="text-sm text-white/60">
                      Nous examinerons votre demande sous 24h
                    </p>
                  </div>
                </div>

                {/* Étape 2 - Rendez-vous client */}
                <div className="relative flex gap-6">
                  <div className="w-6 h-6 rounded-full bg-purple flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">
                      Rendez-vous client
                    </h3>
                    <p className="text-sm text-white/60">
                      Nous vous contacterons à la date choisie pour discuter des
                      détails
                    </p>
                  </div>
                </div>

                {/* Étape 3 - Devis et facturation */}
                <div className="relative flex gap-6">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white/60 mb-1">
                      Devis et facturation
                    </h3>
                    <p className="text-sm text-white/40">
                      Validation finale du devis et du planning du projet
                    </p>
                  </div>
                </div>

                {/* Étape 4 - Ressources du projet */}
                <div className="relative flex gap-6">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white/60 mb-1">
                      Ressources du projet
                    </h3>
                    <p className="text-sm text-white/40">
                      Mise à disposition des ressources nécessaires au projet
                    </p>
                  </div>
                </div>

                {/* Étape 5 - Validation finale */}
                <div className="relative flex gap-6">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white/60 mb-1">
                      Validation finale
                    </h3>
                    <p className="text-sm text-white/40">
                      Vérification et validation de tous les éléments du projet
                    </p>
                  </div>
                </div>

                {/* Étape 6 - Finalisation */}
                <div className="relative flex gap-6">
                  <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center z-10">
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white/60 mb-1">
                      Finalisation
                    </h3>
                    <p className="text-sm text-white/40">
                      Livraison finale et paiement du projet
                    </p>
                  </div>
                </div>
              </div>

              {/* Côté droit - Confirmation */}
              <div className="bg-[#1c1c22] rounded-2xl p-8">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      }}
                    >
                      <FaCheck className="text-3xl text-green-500" />
                    </motion.div>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Demande confirmée !
                    </h2>
                    <p className="text-white/60">
                      Une invitation a été envoyée à {formData.email}
                    </p>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-6"
                >
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white/80 font-medium mb-3">
                      Détails de votre demande :
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-white/80">
                        <FaUser className="text-purple" />
                        <span>
                          {formData.firstName} {formData.lastName}
                        </span>
                      </div>
                      {formData.company && (
                        <div className="flex items-center gap-3 text-white/80">
                          <FaFolder className="text-purple" />
                          <span>{formData.company}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-white/80">
                        <FaCog className="text-purple" />
                        <span>
                          Services :{" "}
                          {formData.selectedServices
                            .map((service) => {
                              const serviceObj = serviceTypes.find(
                                (s) => s.id === service
                              );
                              return serviceObj ? serviceObj.name : service;
                            })
                            .join(", ")}
                        </span>
                      </div>
                      {selectedDate && (
                        <div className="flex items-center gap-3 text-white/80">
                          <FaCalendarAlt className="text-purple" />
                          <span>
                            {new Date(selectedDate).toLocaleDateString(
                              "fr-FR",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">
                        APPUYEZ SUR ENTRÉE POUR CONTINUER
                      </span>
                      <button
                        onClick={() => {
                          resetForm();
                          router.push("/");
                        }}
                        className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-colors"
                      >
                        TERMINÉ
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx global>
        {styles}
      </style>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-[#1c1c22] to-[#27272c]">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 fade-content">
          {/* Header with Progress */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-semibold text-white">
                  {totalProgress}%
                </span>
                <span className="text-white/60">Progression</span>
              </div>
              <button
                onClick={handleCancelProject}
                className="text-white/60 hover:text-red-500 flex items-center gap-2 transition-colors duration-300 group w-full sm:w-auto justify-center sm:justify-start"
              >
                <FaTimes className="w-5 h-5 transform group-hover:rotate-90 transition-transform duration-300" />
                <span>Annuler le projet</span>
              </button>
            </div>

            {/* Barre de progression */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple transition-all duration-300 ease-in-out"
                style={{ width: `${totalProgress}%` }}
              />
            </div>

            {/* Indicateurs d'étapes */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((step) => {
                const status = getStepStatus(step);
                return (
                  <div
                    key={step}
                    className={`flex flex-col items-center ${
                      status === "completed" || status === "current"
                        ? "text-purple"
                        : "text-white/40"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                        status === "completed"
                          ? "bg-purple text-white"
                          : status === "current"
                          ? "bg-purple/20 text-purple border-2 border-purple"
                          : "bg-white/10"
                      }`}
                    >
                      {status === "completed" ? (
                        <FaCheck className="w-4 h-4" />
                      ) : (
                        <span>{step}</span>
                      )}
                    </div>
                    <span className="text-xs hidden sm:block">
                      {step === 1
                        ? "Date"
                        : step === 2
                        ? "Infos"
                        : step === 3
                        ? "Services"
                        : step === 4
                        ? "Projet"
                        : "Fichiers"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
            {/* Left Side - Progress Steps */}
            <div className="w-full lg:w-1/3">
              <div className="flex flex-col gap-8 sticky top-8">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex gap-4">
                    <div className="relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          index + 1 === currentStep
                            ? "bg-purple/20"
                            : "bg-[#27272c]"
                        }`}
                      >
                        <div
                          className={`text-xl ${
                            index + 1 === currentStep
                              ? "text-purple"
                              : "text-white/40"
                          }`}
                        >
                          <step.icon className="text-2xl" />
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`absolute left-1/2 h-full w-0.5 -bottom-8 ${
                            index + 1 === currentStep
                              ? "bg-purple"
                              : "bg-white/10"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-semibold ${
                          index + 1 === currentStep
                            ? "text-white"
                            : "text-white/40"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm text-white/60 mt-1 hidden sm:block">
                        {index + 1 === 1
                          ? "Choisissez une date pour discuter de votre projet"
                          : index + 1 === 2
                          ? "Partagez vos coordonnées pour vous contacter"
                          : index + 1 === 3
                          ? "Sélectionnez les services qui vous intéressent"
                          : index + 1 === 4
                          ? "Décrivez votre projet et vos besoins"
                          : "Ajoutez des documents et ressources utiles"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Current Step Content */}
            <div className="w-full lg:w-2/3">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-[#27272c]/50 backdrop-blur-sm rounded-3xl p-4 sm:p-8 shadow-xl border border-white/5"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <h2 className="text-xl sm:text-2xl font-semibold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    {currentStep === 1
                      ? "Sélectionnez une date de rendez-vous"
                      : currentStep === 2
                      ? "Vos informations"
                      : currentStep === 3
                      ? "Nos services"
                      : currentStep === 4
                      ? "Votre projet"
                      : "Documents & Ressources"}
                  </h2>
                  <p className="text-white/60">Étape {currentStep}/5</p>
                </motion.div>

                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="bg-[#1c1c22] rounded-lg border border-white/10 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={prevMonth}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <FaChevronLeft className="text-white/60" />
                        </button>
                        <h3 className="text-white font-medium">
                          {currentMonth.toLocaleDateString("fr-FR", {
                            month: "long",
                            year: "numeric",
                          })}
                        </h3>
                        <button
                          onClick={nextMonth}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <FaChevronRight className="text-white/60" />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-2 mb-2">
                        {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map(
                          (day) => (
                            <div
                              key={day}
                              className="h-8 flex items-center justify-center text-sm text-white/40"
                            >
                              {day}
                            </div>
                          )
                        )}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {generateCalendarDays()}
                      </div>
                      {dateCheckLoading && (
                        <div className="text-yellow-400 mt-2 text-sm">
                          Vérification des disponibilités...
                        </div>
                      )}
                      {!dateCheckLoading &&
                        selectedDate &&
                        !dateQuotaReached && (
                          <div className="text-green-600 mt-2 text-sm font-semibold">
                            Bonne nouvelle, il reste de la place ! On garde un
                            siège au chaud rien que pour vous 😄
                          </div>
                        )}
                      {dateQuotaReached && !dateCheckLoading && (
                        <div className="text-red-500 mt-2 text-sm font-semibold">
                          Oups, la salle est déjà pleine à craquer ! On ne
                          voudrait pas vous faire tenir debout… Choisissez une
                          autre date 😅
                        </div>
                      )}
                    </div>

                    {renderMeetingPlatforms()}

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                      <Button
                        variant="outline"
                        className="w-full border-white/10 text-white hover:bg-white/5"
                        onClick={handleCancelProject}
                      >
                        Annuler
                      </Button>
                      <Button
                        className="w-full bg-purple hover:bg-purple/90 text-white"
                        onClick={handleNext}
                        disabled={!selectedDate || dateQuotaReached}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <Input
                        type="text"
                        placeholder="Prénom"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData((prevData) => ({
                            ...prevData,
                            firstName: e.target.value,
                          }))
                        }
                        className="w-full bg-[#1c1c22] border-white/10 text-white placeholder:text-white/40 focus:border-purple/50 focus:ring-purple/20"
                      />
                      <Input
                        type="text"
                        placeholder="Nom"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData((prevData) => ({
                            ...prevData,
                            lastName: e.target.value,
                          }))
                        }
                        className="w-full bg-[#1c1c22] border-white/10 text-white placeholder:text-white/40 focus:border-purple/50 focus:ring-purple/20"
                      />
                    </div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prevData) => ({
                          ...prevData,
                          email: e.target.value,
                        }))
                      }
                      className="w-full bg-[#1c1c22] border-white/10 text-white placeholder:text-white/40 focus:border-purple/50 focus:ring-purple/20"
                    />
                    <Input
                      type="tel"
                      placeholder="Téléphone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prevData) => ({
                          ...prevData,
                          phone: e.target.value,
                        }))
                      }
                      className="w-full bg-[#1c1c22] border-white/10 text-white placeholder:text-white/40 focus:border-purple/50 focus:ring-purple/20"
                    />
                    <Input
                      type="text"
                      placeholder="Entreprise (optionnel)"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData((prevData) => ({
                          ...prevData,
                          company: e.target.value,
                        }))
                      }
                      className="w-full bg-[#1c1c22] border-white/10 text-white placeholder:text-white/40 focus:border-purple/50 focus:ring-purple/20"
                    />
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        variant="outline"
                        className="w-full border-white/10 text-white hover:bg-white/5"
                        onClick={handleBack}
                      >
                        Précédent
                      </Button>
                      <Button
                        className="w-full bg-purple hover:bg-purple/90 text-white"
                        onClick={handleNext}
                        disabled={
                          !formData.email ||
                          !formData.firstName ||
                          !formData.lastName ||
                          !formData.phone
                        }
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {serviceTypes.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => {
                            const newServices =
                              formData.selectedServices.includes(service.id)
                                ? formData.selectedServices.filter(
                                    (id) => id !== service.id
                                  )
                                : [...formData.selectedServices, service.id];
                            setFormData((prevData) => ({
                              ...prevData,
                              selectedServices: newServices,
                            }));
                          }}
                          className={`p-4 sm:p-6 rounded-xl border transition-all ${
                            formData.selectedServices.includes(service.id)
                              ? "border-purple bg-purple/10"
                              : "border-white/10 hover:border-purple/50"
                          }`}
                        >
                          <div className="flex flex-col items-center text-center gap-3">
                            <div className="text-2xl sm:text-3xl">
                              {<service.icon className="text-purple" />}
                            </div>
                            <h3 className="font-medium text-white text-base sm:text-lg">
                              {service.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-white/60">
                              {service.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        variant="outline"
                        className="w-full border-white/10 text-white hover:bg-white/5"
                        onClick={handleBack}
                      >
                        Précédent
                      </Button>
                      <Button
                        className="w-full bg-purple hover:bg-purple/90 text-white"
                        onClick={handleNext}
                        disabled={formData.selectedServices.length === 0}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="p-4 sm:p-6 bg-[#1c1c22] rounded-lg border border-white/10">
                      <h3 className="font-medium text-white text-base sm:text-lg mb-4">
                        Description du Projet
                      </h3>
                      <Textarea
                        placeholder="Décrivez votre projet en détail..."
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        className="w-full h-32 sm:h-40 bg-[#1c1c22] border-white/10 text-white placeholder:text-white/40 focus:border-purple/50 focus:ring-purple/20"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm text-white/60 mb-2">
                          Budget Estimé (optionnel)
                        </label>
                        <Input
                          type="text"
                          placeholder="Budget approximatif en €"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="w-full bg-[#1c1c22] border-white/10 text-white placeholder:text-white/40 focus:border-purple/50 focus:ring-purple/20"
                        />
                        <p className="text-xs text-white/40 mt-1">
                          Laissez vide si vous souhaitez en discuter lors du
                          rendez-vous
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-2">
                          Date Limite Souhaitée (optionnel)
                        </label>
                        <Input
                          type="date"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="w-full bg-[#1c1c22] border-white/10 text-white placeholder:text-white/40 focus:border-purple/50 focus:ring-purple/20"
                        />
                        <p className="text-xs text-white/40 mt-1">
                          Laissez vide si flexible
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        variant="outline"
                        className="w-full border-white/10 text-white hover:bg-white/5"
                        onClick={handleBack}
                      >
                        Précédent
                      </Button>
                      <Button
                        className="w-full bg-purple hover:bg-purple/90 text-white"
                        onClick={handleNext}
                        disabled={!projectDescription}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div
                      className={`p-4 sm:p-6 bg-[#1c1c22] rounded-lg border border-white/10 ${
                        isDragActive
                          ? "ring-2 ring-purple/60 border-purple/50 bg-purple/10"
                          : ""
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={handleZoneClick}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div>
                          <h3 className="font-medium text-white text-base sm:text-lg">
                            Documents & Ressources
                          </h3>
                          <p className="text-sm text-white/60 mt-1">
                            Cette étape est optionnelle. Vous pourrez également
                            nous envoyer des documents plus tard.
                          </p>
                        </div>
                        <label
                          className="cursor-pointer bg-purple/20 hover:bg-purple/30 text-purple px-4 py-2 rounded-lg transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaFileUpload className="text-lg" />
                          <span>Ajouter des fichiers</span>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx"
                            ref={fileInputRef}
                          />
                        </label>
                      </div>

                      {formData.files.length > 0 ? (
                        <div className="space-y-3">
                          {formData.files.map((file, index) => (
                            <div
                              key={index}
                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 group hover:border-purple/30 transition-colors gap-4"
                            >
                              <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                  {getFileIcon(file.name)}
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-medium text-sm sm:text-base">
                                    {file.name}
                                  </p>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                                    <p className="text-white/40 text-xs sm:text-sm">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-purple transition-all duration-300"
                                        style={{
                                          width: `${
                                            uploadProgress[file.name] || 0
                                          }%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-white/60 text-xs sm:text-sm">
                                      {uploadProgress[file.name] || 0}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                {uploadProgress[file.name] === 100 ? (
                                  <FaCheckCircle className="text-green-400" />
                                ) : (
                                  <div className="w-5 h-5 border-2 border-purple border-t-transparent rounded-full animate-spin" />
                                )}
                                <button
                                  onClick={() => {
                                    setFormData((prevData) => ({
                                      ...prevData,
                                      files: prevData.files.filter(
                                        (_, i) => i !== index
                                      ),
                                    }));
                                    const newUploadProgress = {
                                      ...uploadProgress,
                                    };
                                    delete newUploadProgress[file.name];
                                    setUploadProgress(newUploadProgress);
                                  }}
                                  className="text-white/40 hover:text-red-400 transition-colors"
                                >
                                  <FaTimesCircle className="text-lg" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 sm:py-10 border-2 border-dashed border-white/10 rounded-lg">
                          <div className="flex flex-col items-center gap-3">
                            <FaFileUpload className="text-3xl sm:text-4xl text-white/20" />
                            <div className="text-white/40">
                              <p className="font-medium text-sm sm:text-base">
                                Glissez-déposez vos fichiers ici (optionnel)
                              </p>
                              <p className="text-xs sm:text-sm">
                                ou cliquez pour sélectionner des fichiers
                              </p>
                            </div>
                            <div className="text-xs text-white/30 mt-2 space-y-1">
                              <p>Formats acceptés : JPG, PNG, PDF, DOC, XLS</p>
                              <p>Taille maximale : 10MB par fichier</p>
                              <p>
                                Vous pourrez également nous envoyer des
                                documents ultérieurement
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {formData.files.length > 0 && (
                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
                          <span className="text-white/60">
                            {formData.files.length} fichier(s) ajouté(s)
                          </span>
                          <button
                            onClick={() => {
                              setFormData((prevData) => ({
                                ...prevData,
                                files: [],
                              }));
                              setUploadProgress({});
                            }}
                            className="text-red-400 hover:text-red-500 transition-colors"
                          >
                            Tout supprimer
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        variant="outline"
                        className="w-full border-white/10 text-white hover:bg-white/5"
                        onClick={handleBack}
                      >
                        Précédent
                      </Button>
                      <Button
                        className={`w-full relative ${
                          isLoading
                            ? "bg-purple/50 cursor-not-allowed"
                            : "bg-purple hover:bg-purple/90"
                        } text-white transition-all duration-300`}
                        onClick={handleSubmit}
                        disabled={isLoading}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              <span>Envoi en cours...</span>
                            </>
                          ) : (
                            "Terminer"
                          )}
                        </div>
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1c1c22] p-6 rounded-xl shadow-xl border border-white/10 max-w-md w-full mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaTimes className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Êtes-vous sûr de vouloir annuler ?
                </h3>
                <p className="text-white/60 mb-6">
                  Toutes les informations saisies seront perdues.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors w-full sm:w-auto"
                  >
                    Continuer le projet
                  </button>
                  <button
                    onClick={confirmCancel}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors w-full sm:w-auto"
                  >
                    Oui, annuler
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message d'erreur */}
      {showError && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
        >
          <p className="text-red-500 text-sm text-center">{errorMessage}</p>
        </motion.div>
      )}
    </>
  );
};

export default Contact;