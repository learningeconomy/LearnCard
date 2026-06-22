/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Golive_Completeditems34Inputs */

const en_developerportal_guides_issuecredentials_golive_completeditems34 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Completeditems34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tested issuing and verification`)
};

const es_developerportal_guides_issuecredentials_golive_completeditems34 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Completeditems34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emisión y verificación probadas`)
};

const fr_developerportal_guides_issuecredentials_golive_completeditems34 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Completeditems34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Émission et vérification testées`)
};

const ar_developerportal_guides_issuecredentials_golive_completeditems34 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Completeditems34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم اختبار الإصدار والتحقق`)
};

/**
* | output |
* | --- |
* | "Tested issuing and verification" |
*
* @param {Developerportal_Guides_Issuecredentials_Golive_Completeditems34Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_golive_completeditems34 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Golive_Completeditems34Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Golive_Completeditems34Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_golive_completeditems34(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_golive_completeditems34(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_golive_completeditems34(inputs)
	return ar_developerportal_guides_issuecredentials_golive_completeditems34(inputs)
});
export { developerportal_guides_issuecredentials_golive_completeditems34 as "developerPortal.guides.issueCredentials.goLive.completedItems3" }