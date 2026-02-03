// Site Configuration - Change values here to reflect across the entire project
export const siteConfig = {
  name: "LegalDrishti",
  tagline: "Legal Network",
  description: "Find Expert Legal Professionals",
  
  // Contact Information
  contact: {
    phone: "1800-XXX-XXXX",
    email: "help@legaldrishti.legal",
  },
  
  // Statistics
  stats: {
    experts: "5,000+",
    practiceAreas: "50+",
    cases: "10,000+",
  },
  
  // Navigation Links
  navLinks: [
    { label: "Home", href: "/" },
    { label: "Find Experts", href: "/find-experts" },
    { label: "About", href: "/about" },
    { label: "Resources", href: "/resources" },
    { label: "Join as Expert", href: "/join-expert" },
  ],
  
}

// Helper to get copyright with current year
export const getCopyright = () => 
  `© ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.`
