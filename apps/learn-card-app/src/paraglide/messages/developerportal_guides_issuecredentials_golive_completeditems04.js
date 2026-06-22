/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Issuecredentials_Golive_Completeditems04Inputs */

const en_developerportal_guides_issuecredentials_golive_completeditems04 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Completeditems04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Created API token for server-side access`)
};

const es_developerportal_guides_issuecredentials_golive_completeditems04 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Completeditems04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Token de API creado para acceso del servidor`)
};

const fr_developerportal_guides_issuecredentials_golive_completeditems04 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Completeditems04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Jeton API créé pour l'accès serveur`)
};

const ar_developerportal_guides_issuecredentials_golive_completeditems04 = /** @type {(inputs: Developerportal_Guides_Issuecredentials_Golive_Completeditems04Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إنشاء رمز API للوصول من جانب الخادم`)
};

/**
* | output |
* | --- |
* | "Created API token for server-side access" |
*
* @param {Developerportal_Guides_Issuecredentials_Golive_Completeditems04Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_issuecredentials_golive_completeditems04 = /** @type {((inputs?: Developerportal_Guides_Issuecredentials_Golive_Completeditems04Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Issuecredentials_Golive_Completeditems04Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_issuecredentials_golive_completeditems04(inputs)
	if (locale === "es") return es_developerportal_guides_issuecredentials_golive_completeditems04(inputs)
	if (locale === "fr") return fr_developerportal_guides_issuecredentials_golive_completeditems04(inputs)
	return ar_developerportal_guides_issuecredentials_golive_completeditems04(inputs)
});
export { developerportal_guides_issuecredentials_golive_completeditems04 as "developerPortal.guides.issueCredentials.goLive.completedItems0" }