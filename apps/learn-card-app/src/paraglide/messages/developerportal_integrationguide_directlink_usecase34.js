/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Directlink_Usecase34Inputs */

const en_developerportal_integrationguide_directlink_usecase34 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Usecase34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Apps that only need user identification`)
};

const es_developerportal_integrationguide_directlink_usecase34 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Usecase34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aplicaciones que solo necesitan identificación del usuario`)
};

const fr_developerportal_integrationguide_directlink_usecase34 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Usecase34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Applications qui n'ont besoin que d'identification de l'utilisateur`)
};

const ar_developerportal_integrationguide_directlink_usecase34 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Usecase34Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التطبيقات التي تحتاج فقط إلى تعريف المستخدم`)
};

/**
* | output |
* | --- |
* | "Apps that only need user identification" |
*
* @param {Developerportal_Integrationguide_Directlink_Usecase34Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_directlink_usecase34 = /** @type {((inputs?: Developerportal_Integrationguide_Directlink_Usecase34Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Directlink_Usecase34Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_directlink_usecase34(inputs)
	if (locale === "es") return es_developerportal_integrationguide_directlink_usecase34(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_directlink_usecase34(inputs)
	return ar_developerportal_integrationguide_directlink_usecase34(inputs)
});
export { developerportal_integrationguide_directlink_usecase34 as "developerPortal.integrationGuide.directLink.useCase3" }