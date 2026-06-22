/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Golive_Title3Inputs */

const en_developerportal_guides_issuecredentials_golive_title3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ready to Issue Credentials!`)
};

const es_developerportal_guides_issuecredentials_golive_title3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Listo para Emitir Credenciales!`)
};

const fr_developerportal_guides_issuecredentials_golive_title3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Prêt à Émettre des Certificats !`)
};

const ar_developerportal_guides_issuecredentials_golive_title3 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Title3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاهز لإصدار المؤهلات!`)
};

/**
* | output |
* | --- |
* | "Ready to Issue Credentials!" |
*
* @param {Developerportal_Guides_Issuecredentials_Golive_Title3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_golive_title3 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Golive_Title3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Golive_Title3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_golive_title3(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_golive_title3(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_golive_title3(inputs)
	return ar_developerportal_guides_issuecredentials_golive_title3(inputs)
});
export { developerportal_guides_issuecredentials_golive_title3 as "developerPortal.guides.issueCredentials.goLive.title" }