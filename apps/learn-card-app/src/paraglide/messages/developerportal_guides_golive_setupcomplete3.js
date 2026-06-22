/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Golive_Setupcomplete3Inputs */

const en_developerportal_guides_golive_setupcomplete3 = /** @type {(inputs: Developerportal_Guides_Golive_Setupcomplete3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Setup Complete`)
};

const es_developerportal_guides_golive_setupcomplete3 = /** @type {(inputs: Developerportal_Guides_Golive_Setupcomplete3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuración Completa`)
};

const fr_developerportal_guides_golive_setupcomplete3 = /** @type {(inputs: Developerportal_Guides_Golive_Setupcomplete3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configuration Terminée`)
};

const ar_developerportal_guides_golive_setupcomplete3 = /** @type {(inputs: Developerportal_Guides_Golive_Setupcomplete3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اكتمل الإعداد`)
};

/**
* | output |
* | --- |
* | "Setup Complete" |
*
* @param {Developerportal_Guides_Golive_Setupcomplete3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_golive_setupcomplete3 = /** @type {((inputs?: Developerportal_Guides_Golive_Setupcomplete3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Golive_Setupcomplete3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_golive_setupcomplete3(inputs)
	if (locale === "es") return es_developerportal_guides_golive_setupcomplete3(inputs)
	if (locale === "fr") return fr_developerportal_guides_golive_setupcomplete3(inputs)
	return ar_developerportal_guides_golive_setupcomplete3(inputs)
});
export { developerportal_guides_golive_setupcomplete3 as "developerPortal.guides.goLive.setupComplete" }