/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Credentialinfo_Nameplaceholder4Inputs */

const en_developerportal_credentialbuilder_credentialinfo_nameplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Nameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Academic Transcript`)
};

const es_developerportal_credentialbuilder_credentialinfo_nameplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Nameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Transcripción Académica`)
};

const fr_developerportal_credentialbuilder_credentialinfo_nameplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Nameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Relevé de Notes`)
};

const ar_developerportal_credentialbuilder_credentialinfo_nameplaceholder4 = /** @type {(inputs: Developerportal_Credentialbuilder_Credentialinfo_Nameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: كشف الدرجات الأكاديمي`)
};

/**
* | output |
* | --- |
* | "e.g., Academic Transcript" |
*
* @param {Developerportal_Credentialbuilder_Credentialinfo_Nameplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_credentialinfo_nameplaceholder4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Credentialinfo_Nameplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Credentialinfo_Nameplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_credentialinfo_nameplaceholder4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_credentialinfo_nameplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_credentialinfo_nameplaceholder4(inputs)
	return ar_developerportal_credentialbuilder_credentialinfo_nameplaceholder4(inputs)
});
export { developerportal_credentialbuilder_credentialinfo_nameplaceholder4 as "developerPortal.credentialBuilder.credentialInfo.namePlaceholder" }