/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Golive_Successdescription3Inputs */

const en_developerportal_guides_golive_successdescription3 = /** @type {(inputs: Developerportal_Guides_Golive_Successdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your integration is now active. Redirecting to your dashboard...`)
};

const es_developerportal_guides_golive_successdescription3 = /** @type {(inputs: Developerportal_Guides_Golive_Successdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu integración ahora está activa. Redirigiendo a tu panel de control...`)
};

const fr_developerportal_guides_golive_successdescription3 = /** @type {(inputs: Developerportal_Guides_Golive_Successdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre intégration est maintenant active. Redirection vers votre tableau de bord...`)
};

const ar_developerportal_guides_golive_successdescription3 = /** @type {(inputs: Developerportal_Guides_Golive_Successdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التكامل الخاص بك نشط الآن. جارٍ إعادة التوجيه إلى لوحة التحكم...`)
};

/**
* | output |
* | --- |
* | "Your integration is now active. Redirecting to your dashboard..." |
*
* @param {Developerportal_Guides_Golive_Successdescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_golive_successdescription3 = /** @type {((inputs?: Developerportal_Guides_Golive_Successdescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Golive_Successdescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_golive_successdescription3(inputs)
	if (locale === "es") return es_developerportal_guides_golive_successdescription3(inputs)
	if (locale === "fr") return fr_developerportal_guides_golive_successdescription3(inputs)
	return ar_developerportal_guides_golive_successdescription3(inputs)
});
export { developerportal_guides_golive_successdescription3 as "developerPortal.guides.goLive.successDescription" }