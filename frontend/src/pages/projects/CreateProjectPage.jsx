import ProjectSubmissionForm from '../../components/project-form/ProjectSubmissionForm';

export default function CreateProjectPage() {
  return <ProjectSubmissionForm />;
}

/* ==========================================================================
 * OLD IMPLEMENTATION (commented out — kept for reference)
 * ==========================================================================
 *
 * import { useState, useEffect } from 'react';
 * import { useNavigate, useSearchParams } from 'react-router-dom';
 * import { propertiesApi } from '../../api/properties';
 * import { investmentProjectsApi } from '../../api/investments';
 * import { useAuth } from '../../context/AuthContext';
 * import { projectImagesApi } from '../../api/images';
 * import { ArrowLeft, ArrowRight, Check, Building, TrendingUp, Calendar, Euro, ImagePlus, X } from 'lucide-react';
 * import FormSelect from '../../components/FormSelect';
 * import toast from 'react-hot-toast';
 *
 * const STEPS = [
 *   { id: 1, title: 'Sélection du bien', icon: Building },
 *   { id: 2, title: 'Configuration financière', icon: Euro },
 *   { id: 3, title: 'Photos du projet', icon: ImagePlus },
 *   { id: 4, title: 'Planning & Validation', icon: Calendar },
 * ];
 *
 * export default function CreateProjectPage() {
 *   const navigate = useNavigate();
 *   const [searchParams] = useSearchParams();
 *   const { user } = useAuth();
 *   const [currentStep, setCurrentStep] = useState(1);
 *   const [properties, setProperties] = useState([]);
 *   const [loading, setLoading] = useState(true);
 *   const [submitting, setSubmitting] = useState(false);
 *
 *   const [formData, setFormData] = useState({
 *     // Step 1
 *     property_ids: searchParams.get('propertyId') ? [searchParams.get('propertyId')] : [],
 *     title: '',
 *     description: '',
 *
 *     // Step 2
 *     total_amount_cents: '',
 *     share_price_cents: '',
 *     total_shares: '',
 *     min_investment_cents: '',
 *     max_investment_cents: '',
 *     management_fee_percent: '2.5',
 *     gross_yield_percent: '',
 *     net_yield_percent: '',
 *
 *     // Step 3
 *     funding_start_date: '',
 *     funding_end_date: '',
 *   });
 *
 *   const [photos, setPhotos] = useState([]);
 *   const [errors, setErrors] = useState({});
 *
 *   useEffect(() => {
 *     loadProperties();
 *   }, []);
 *
 *   const loadProperties = async () => {
 *     try {
 *       const res = await propertiesApi.list();
 *       setProperties(res.data.data || []);
 *     } catch (err) {
 *       toast.error('Erreur lors du chargement des biens');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   const getSelectedProperties = () => {
 *     const ids = formData.property_ids || [];
 *     return properties.filter(p => ids.includes(String(p.id)));
 *   };
 *
 *   const togglePropertyId = (id) => {
 *     const sid = String(id);
 *     setFormData(prev => {
 *       const ids = prev.property_ids || [];
 *       if (ids.includes(sid)) return { ...prev, property_ids: ids.filter(i => i !== sid) };
 *       return { ...prev, property_ids: [...ids, sid] };
 *     });
 *   };
 *
 *   const validateStep1 = () => {
 *     const newErrors = {};
 *     if (!formData.property_ids?.length) newErrors.property_ids = 'Veuillez sélectionner au moins un bien';
 *     if (!formData.title?.trim()) newErrors.title = 'Le titre est requis';
 *     setErrors(newErrors);
 *     return Object.keys(newErrors).length === 0;
 *   };
 *
 *   const validateStep2 = () => {
 *     const newErrors = {};
 *     const sharePrice = parseFloat(formData.share_price_cents);
 *     const totalAmount = parseFloat(formData.total_amount_cents);
 *     const totalShares = parseInt(formData.total_shares);
 *     const minInvest = parseFloat(formData.min_investment_cents);
 *
 *     if (!sharePrice || sharePrice <= 0) {
 *       newErrors.share_price_cents = 'Le prix par part doit être supérieur à 0';
 *     }
 *     if (!totalAmount && !totalShares) {
 *       newErrors.total_amount_cents = 'Renseignez le montant total ou le nombre de parts';
 *     }
 *     if (!minInvest || minInvest <= 0) {
 *       newErrors.min_investment_cents = "L'investissement minimum est requis";
 *     }
 *
 *     setErrors(newErrors);
 *     return Object.keys(newErrors).length === 0;
 *   };
 *
 *   const validateStep3 = () => {
 *     const newErrors = {};
 *     if (!formData.funding_start_date) {
 *       newErrors.funding_start_date = 'La date de début est requise';
 *     }
 *     if (!formData.funding_end_date) {
 *       newErrors.funding_end_date = 'La date de fin est requise';
 *     }
 *     if (formData.funding_start_date && formData.funding_end_date) {
 *       if (new Date(formData.funding_end_date) <= new Date(formData.funding_start_date)) {
 *         newErrors.funding_end_date = 'La date de fin doit être postérieure à la date de début';
 *       }
 *     }
 *     setErrors(newErrors);
 *     return Object.keys(newErrors).length === 0;
 *   };
 *
 *   const handleNext = () => {
 *     let isValid = false;
 *     if (currentStep === 1) isValid = validateStep1();
 *     else if (currentStep === 2) isValid = validateStep2();
 *     else if (currentStep === 3) isValid = true;
 *     else if (currentStep === 4) isValid = validateStep3();
 *
 *     if (isValid && currentStep < 4) {
 *       setCurrentStep(currentStep + 1);
 *       window.scrollTo({ top: 0, behavior: 'smooth' });
 *     }
 *   };
 *
 *   const handleBack = () => {
 *     if (currentStep > 1) {
 *       setCurrentStep(currentStep - 1);
 *       setErrors({});
 *       window.scrollTo({ top: 0, behavior: 'smooth' });
 *     }
 *   };
 *
 *   const handleSubmit = async () => {
 *     if (!validateStep3()) return;
 *
 *     setSubmitting(true);
 *     try {
 *       const data = {
 *         title: formData.title.trim(),
 *         description: formData.description?.trim() || undefined,
 *         total_amount_cents: Math.round(parseFloat(formData.total_amount_cents) * 100) || 0,
 *         share_price_cents: Math.round(parseFloat(formData.share_price_cents) * 100),
 *         total_shares: formData.total_shares ? parseInt(formData.total_shares) : undefined,
 *         min_investment_cents: Math.round(parseFloat(formData.min_investment_cents) * 100),
 *         max_investment_cents: formData.max_investment_cents ? Math.round(parseFloat(formData.max_investment_cents) * 100) : undefined,
 *         management_fee_percent: formData.management_fee_percent ? parseFloat(formData.management_fee_percent) : undefined,
 *         gross_yield_percent: formData.gross_yield_percent ? parseFloat(formData.gross_yield_percent) : undefined,
 *         net_yield_percent: formData.net_yield_percent ? parseFloat(formData.net_yield_percent) : undefined,
 *         funding_start_date: formData.funding_start_date,
 *         funding_end_date: formData.funding_end_date,
 *       };
 *
 *       const res = await investmentProjectsApi.create({ ...data, property_ids: formData.property_ids });
 *       const projectId = res.data.data?.id || res.data.id;
 *
 *       if (photos.length > 0 && projectId) {
 *         try {
 *           await projectImagesApi.uploadImages(projectId, photos);
 *         } catch {
 *           toast.error("Projet créé mais erreur lors de l'upload des photos");
 *         }
 *       }
 *
 *       toast.success("Projet d'investissement créé avec succès !");
 *       navigate('/properties');
 *     } catch (err) {
 *       const res = err.response;
 *       const msg = res?.data?.errors?.join(', ') || res?.data?.error || 'Erreur lors de la création';
 *       toast.error(msg);
 *     } finally {
 *       setSubmitting(false);
 *     }
 *   };
 *
 *   const updateField = (field, value) => {
 *     setFormData(prev => {
 *       const updated = { ...prev, [field]: value };
 *       if (field === 'gross_yield_percent') {
 *         const grossYield = parseFloat(value);
 *         const managementFee = 2.5;
 *         if (!isNaN(grossYield)) {
 *           updated.net_yield_percent = (grossYield - managementFee).toFixed(2);
 *         }
 *       }
 *       return updated;
 *     });
 *     if (errors[field]) {
 *       setErrors(prev => ({ ...prev, [field]: undefined }));
 *     }
 *   };
 *
 *   const handleAddPhotos = (e) => {
 *     const files = Array.from(e.target.files);
 *     if (files.length === 0) return;
 *     setPhotos(prev => [...prev, ...files]);
 *     e.target.value = '';
 *   };
 *
 *   const handleRemovePhoto = (index) => {
 *     setPhotos(prev => prev.filter((_, i) => i !== index));
 *   };
 *
 *   const calculatedShares = () => {
 *     const total = parseFloat(formData.total_amount_cents);
 *     const price = parseFloat(formData.share_price_cents);
 *     if (total > 0 && price > 0 && !formData.total_shares) {
 *       return Math.floor((total * 100) / (price * 100));
 *     }
 *     return null;
 *   };
 *
 *   // ... rest of the old JSX render (stepper + 4-step form + wizard-actions)
 * }
 *
 * ========================================================================== */
