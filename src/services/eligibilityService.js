function calculateAgeCategory(birthDateString) {
    const birthDate = new Date(birthDateString);
    const currentYear = new Date().getFullYear();
    const ageAtEndOfYear = currentYear - birthDate.getFullYear();

    if (ageAtEndOfYear < 6) return 'Éveil';
    if (ageAtEndOfYear <= 8) return 'Poussin (U9)';
    if (ageAtEndOfYear <= 10) return 'Benjamin (U11)';
    if (ageAtEndOfYear <= 12) return 'Minime (U13)';
    if (ageAtEndOfYear <= 14) return 'Cadet (U15)';
    if (ageAtEndOfYear <= 17) return 'Junior (U18)';
    if (ageAtEndOfYear <= 39) return 'Senior';
    return 'Vétéran / Master';
}

function isMedicalCertificateValid(certificateDateString, isHighRisk) {
    const certDate = new Date(certificateDateString);
    const currentDate = new Date();
    const validityYears = isHighRisk ? 1 : 3;
    const expirationDate = new Date(certDate);
    expirationDate.setFullYear(certDate.getFullYear() + validityYears);
    return currentDate <= expirationDate;
}

module.exports = {
    calculateAgeCategory,
    isMedicalCertificateValid
};