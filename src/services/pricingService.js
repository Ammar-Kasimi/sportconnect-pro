function calculateFinalPrice(basePrice, isResident, existingFamilyRegistrations, quotientFamilial, hasPassSport) {
    let currentPrice = parseFloat(basePrice);
    if (!isResident) {
        currentPrice = currentPrice * 1.35;
    }
    let familyDiscount = 0;
    if (existingFamilyRegistrations === 1) {
        familyDiscount = 0.15;
    } else if (existingFamilyRegistrations >= 2) {
        familyDiscount = 0.30;
    }
    currentPrice = currentPrice - (currentPrice * familyDiscount);
    let qfDiscount = 0;
    if (quotientFamilial !== null && quotientFamilial !== undefined) {
        if (quotientFamilial < 600) {
            qfDiscount = 0.40;
        } else if (quotientFamilial >= 600 && quotientFamilial <= 900) {
            qfDiscount = 0.20;
        }
    }
    currentPrice = currentPrice - (currentPrice * qfDiscount);
    if (hasPassSport) {
        currentPrice = currentPrice - 50;
    }
    if (currentPrice < 15) {
        currentPrice = 15;
    }
    const finalPrice = Math.round(currentPrice * 100) / 100;
    const echeance2 = Math.round((finalPrice * 0.30) * 100) / 100;
    const echeance3 = echeance2;
    const echeance1 = Math.round((finalPrice - echeance2 - echeance3) * 100) / 100;

    return {
        basePrice: parseFloat(basePrice),
        finalPrice: finalPrice,
        installments: {
            payment1: echeance1,
            payment2: echeance2,
            payment3: echeance3
        }
    };
}
module.exports = {
    calculateFinalPrice
};