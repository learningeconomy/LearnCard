/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Directlink_Usecase24Inputs */

const en_developerportal_integrationguide_directlink_usecase24 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Usecase24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`External services or portals`)
};

const es_developerportal_integrationguide_directlink_usecase24 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Usecase24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Servicios o portales externos`)
};

const fr_developerportal_integrationguide_directlink_usecase24 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Usecase24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Services ou portails externes`)
};

const ar_developerportal_integrationguide_directlink_usecase24 = /** @type {(inputs: Developerportal_Integrationguide_Directlink_Usecase24Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخدمات أو البوابات الخارجية`)
};

/**
* | output |
* | --- |
* | "External services or portals" |
*
* @param {Developerportal_Integrationguide_Directlink_Usecase24Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_directlink_usecase24 = /** @type {((inputs?: Developerportal_Integrationguide_Directlink_Usecase24Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Directlink_Usecase24Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_directlink_usecase24(inputs)
	if (locale === "es") return es_developerportal_integrationguide_directlink_usecase24(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_directlink_usecase24(inputs)
	return ar_developerportal_integrationguide_directlink_usecase24(inputs)
});
export { developerportal_integrationguide_directlink_usecase24 as "developerPortal.integrationGuide.directLink.useCase2" }