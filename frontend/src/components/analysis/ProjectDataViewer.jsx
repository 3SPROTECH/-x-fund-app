import { useState } from 'react';
import { Eye, User, DollarSign, Building, FileText, MessageSquare } from 'lucide-react';

import TabOverview from './tabs/TabOverview';
import TabPorteur from './tabs/TabPorteur';
import TabFinances from './tabs/TabFinances';
import TabActifs from './tabs/TabActifs';
import TabDocuments from './tabs/TabDocuments';
import TabHistorique from './tabs/TabHistorique';
import DocumentViewer from './DocumentViewer';

const TABS = [
  {
    label: "Vue d'ensemble",
    icon: Eye,
    subTabs: ['Fiche projet', 'Photos', 'Localisation'],
    Component: TabOverview,
  },
  {
    label: 'Porteur',
    icon: User,
    subTabs: ['Identite', 'Experience & Track record'],
    Component: TabPorteur,
  },
  {
    label: 'Finances',
    icon: DollarSign,
    subTabs: ['Structure', 'Projections'],
    Component: TabFinances,
  },
  {
    label: 'Actifs',
    icon: Building,
    subTabs: ['Details & Calendrier', 'Depenses', 'Lots & Revenus', 'Garanties'],
    Component: TabActifs,
  },
  {
    label: 'Documents',
    icon: FileText,
    subTabs: ['Justificatifs', 'Preuves garanties'],
    Component: TabDocuments,
  },
  {
    label: 'Historique',
    icon: MessageSquare,
    subTabs: ['Demandes', 'Reponses'],
    Component: TabHistorique,
  },
];

export default function ProjectDataViewer({ project, infoRequests }) {
  const [activeTab, setActiveTab] = useState(0);
  const [activeSubTabs, setActiveSubTabs] = useState(() => TABS.map(() => 0));
  const [activeDocument, setActiveDocument] = useState(null);

  const currentTab = TABS[activeTab];
  const currentSubTab = activeSubTabs[activeTab];
  const TabComponent = currentTab.Component;

  const handleTabClick = (index) => {
    setActiveTab(index);
    setActiveDocument(null);
  };

  const handleSubTabClick = (index) => {
    setActiveSubTabs((prev) => {
      const next = [...prev];
      next[activeTab] = index;
      return next;
    });
    setActiveDocument(null);
  };

  const handleOpenDocument = (doc) => {
    setActiveDocument(doc);
  };

  const handleBackFromDocument = () => {
    setActiveDocument(null);
  };

  if (activeDocument) {
    return (
      <div className="an-viewer">
        <DocumentViewer document={activeDocument} onBack={handleBackFromDocument} />
      </div>
    );
  }

  return (
    <div className="an-viewer">
      {/* Level 1 — Primary tabs */}
      <div className="an-viewer-tabs">
        {TABS.map((tab, idx) => {
          const Icon = tab.icon;
          return (
            <button
              key={idx}
              className={`an-viewer-tab${idx === activeTab ? ' active' : ''}`}
              onClick={() => handleTabClick(idx)}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Level 2 — Sub tabs */}
      <div className="an-viewer-subtabs">
        {currentTab.subTabs.map((label, idx) => (
          <button
            key={idx}
            className={`an-viewer-subtab${idx === currentSubTab ? ' active' : ''}`}
            onClick={() => handleSubTabClick(idx)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="an-viewer-content">
        <TabComponent
          subTab={currentSubTab}
          project={project}
          infoRequests={infoRequests}
          onOpenDocument={handleOpenDocument}
        />
      </div>
    </div>
  );
}
