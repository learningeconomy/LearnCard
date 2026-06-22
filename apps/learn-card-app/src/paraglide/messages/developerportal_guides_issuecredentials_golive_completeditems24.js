/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Golive_Completeditems24Inputs */

const en_developerportal_guides_issuecredentials_golive_completeditems24 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Completeditems24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created credential templates`)
};

const es_developerportal_guides_issuecredentials_golive_completeditems24 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Completeditems24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plantillas de credenciales creadas`)
};

const fr_developerportal_guides_issuecredentials_golive_completeditems24 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Completeditems24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modèles de certificats créés`)
};

const ar_developerportal_guides_issuecredentials_golive_completeditems24 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Completeditems24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إنشاء قوالب المؤهلات`)
};

/**
* | output |
* | --- |
* | "Created credential templates" |
*
* @param {Developerportal_Guides_Issuecredentials_Golive_Completeditems24Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_golive_completeditems24 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Golive_Completeditems24Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Golive_Completeditems24Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_golive_completeditems24(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_golive_completeditems24(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_golive_completeditems24(inputs)
	return ar_developerportal_guides_issuecredentials_golive_completeditems24(inputs)
});
export { developerportal_guides_issuecredentials_golive_completeditems24 as "developerPortal.guides.issueCredentials.goLive.completedItems2" }